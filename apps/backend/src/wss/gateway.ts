import { GatewayOpcode as Op, GatewayCloseCode as Close, gatewayVersion } from '@nodus/shared';
import type { Server, IncomingMessage } from 'node:http';
import { WebSocketServer, type WebSocket } from 'ws';
import { allowedOrigins } from '../middlewares/csrf.middleware';
import { SESSION_COOKIE } from '../utils/session';
import { authenticateSession } from '../utils/authenticate-session';
import { GatewayDispatcher } from './dispatcher';
import { GatewaySocket } from './socket';
import { GatewaySession } from './session';

export class Gateway {
    readonly server: Server;
    readonly dispatcher: GatewayDispatcher;
    private static readonly heartbeatInterval = 30000;
    private static readonly maxSessions = 512;
    private readonly sockets: WebSocketServer;
    private readonly sessions = new Map<string, GatewaySession>();
    private readonly connections = new Set<GatewaySocket>();
    private readonly attempts = new Map<
        string,
        {
            count: number;
            until: number;
        }
    >();
    private readonly maintenance: ReturnType<typeof setInterval>;
    private disposed = false;

    constructor(server: Server) {
        this.server = server;

        this.sockets = new WebSocketServer({
            server,
            path: '/',
            perMessageDeflate: false,
            maxPayload: 64 * 1024,
            verifyClient: (info, done) => this.verifyConnection(info.req, done)
        });

        this.sockets.on('connection', this.onConnection);

        this.dispatcher = new GatewayDispatcher({
            sessions: () => this.sessions.values(),
            invalidate: (session, code) => this.invalidate(session, code),
            reset: (session) => this.resetSession(session)
        });

        this.maintenance = setInterval(this.maintain, 5000);

        this.maintenance.unref();

        server.once('close', this.dispose);
    }

    reconnectClients() {
        for (const connection of this.connections) {
            connection.control(Op.Reconnect);
        }
    }

    requestHeartbeats() {
        for (const connection of this.connections) {
            connection.control(Op.Heartbeat);
        }
    }

    dispose = () => {
        if (this.disposed) {
            return;
        }

        this.disposed = true;

        this.server.off('close', this.dispose);

        clearInterval(this.maintenance);

        this.dispatcher.dispose();

        for (const connection of this.connections) {
            connection.dispose();
        }

        for (const session of this.sessions.values()) {
            session.destroy();
        }

        this.sessions.clear();

        this.connections.clear();

        this.attempts.clear();

        this.sockets.close();
    };

    private destroySession(session: GatewaySession) {
        if (session.isDestroyed) {
            return;
        }

        this.sessions.delete(session.id);

        session.destroy();

        if (!this.disposed) {
            this.dispatcher.onDisconnected(session);
        }
    }

    private failSession(session: GatewaySession, error: Error) {
        console.error('Gateway:', error.message);

        session.connection?.close(Close.UnknownError, 'Service unavailable');

        this.destroySession(session);
    }

    private invalidate(session: GatewaySession, code: 'SESSION_EXPIRED' | 'USER_DISABLED' | 'LOGGED_OUT') {
        if (session.isReady) {
            session.dispatch('SESSION_REVOKED', {
                code
            });
        }

        const connection = session.connection;

        this.destroySession(session);

        connection?.close(Close.AuthenticationFailed, code);
    }

    private resetSession(session: GatewaySession) {
        session.enqueue(async () => {
            session.dispatch('READY', {
                ...(await this.dispatcher.snapshot(session)),
                v: gatewayVersion
            });
        });
    }

    private async identity(connection: GatewaySocket, anonymous: boolean) {
        if (anonymous) {
            return null;
        }

        const token = this.getToken(connection.request);

        if (token) {
            return authenticateSession(token);
        }

        return null;
    }

    private async identify(connection: GatewaySocket, data: Record<string, unknown>) {
        if (connection.session || connection.identifying) {
            return connection.close(Close.AlreadyAuthenticated, 'Already authenticated');
        }

        if ('anonymous' in data && typeof data.anonymous !== 'boolean') {
            return connection.close(Close.DecodeError, 'Invalid anonymous flag');
        }

        connection.identifying = true;

        try {
            const auth = await this.identity(connection, data.anonymous === true);

            if (!connection.isOpen || this.disposed) {
                return;
            }

            if (this.sessions.size >= Gateway.maxSessions) {
                return connection.close(Close.RateLimited, 'Gateway capacity reached');
            }

            const session = new GatewaySession({
                userId: auth ? auth.user.id : null,
                authSessionId: auth?.session.id ?? null,
                authExpiresAt: auth?.session.expiresAt.getTime() ?? Infinity,
                onError: (err) => this.failSession(session, err)
            });

            session.attach(connection);

            this.sessions.set(session.id, session);

            session.enqueue(async () => {
                const snapshot = await this.dispatcher.snapshot(session);

                if (session.isDestroyed) {
                    return;
                }

                connection.completeHandshake();

                session.dispatch('READY', {
                    ...snapshot,
                    v: gatewayVersion
                });

                this.dispatcher.onConnected(session);
            });
        } catch (err) {
            if ([401, 403].includes(err.statusCode)) {
                connection.close(
                    Close.AuthenticationFailed,
                    err.message === 'USER_DISABLED' ? 'USER_DISABLED' : 'SESSION_EXPIRED'
                );
            } else {
                console.error('Gateway authentication:', err.message);

                connection.close(Close.UnknownError, 'Service unavailable');
            }
        }
    }

    private onConnection = (socket: WebSocket, request: IncomingMessage) => {
        const connection = new GatewaySocket(socket, request, {
            message: this.onMessage,
            close: this.onClose
        });

        this.connections.add(connection);

        const url = new URL(request.url, 'http://gateway.local');

        if (url.searchParams.has('v') && url.searchParams.get('v') !== String(gatewayVersion)) {
            return connection.close(Close.InvalidVersion, 'Invalid API version');
        }

        if (url.searchParams.has('encoding') && url.searchParams.get('encoding') !== 'json') {
            return connection.close(Close.DecodeError, 'Only JSON encoding is supported');
        }

        connection.control(Op.Hello, {
            heartbeat_interval: Gateway.heartbeatInterval
        });
    };

    private onMessage = (
        connection: GatewaySocket,
        packet: {
            op: number;
            d: unknown;
        }
    ) => {
        if (this.disposed) {
            return;
        }

        if (packet.op === Op.Subscribe || packet.op === Op.Unsubscribe) {
            const session = connection.session;

            if (!session || typeof packet.d !== 'string') {
                return connection.close(Close.DecodeError, 'Invalid subscription');
            }

            const topic = packet.d;

            if (topic !== 'todos' || !session.isReady || !session.userId) {
                return connection.close(Close.DecodeError, 'Invalid subscription');
            }

            if (packet.op === Op.Subscribe) {
                session.enqueue(async () => {
                    await this.dispatcher.subscribe(session, topic);
                });
            } else {
                session.enqueue(async () => {
                    this.dispatcher.unsubscribe(session, topic);
                });
            }

            return;
        }

        if (packet.op !== Op.Identify) {
            return connection.close(Close.UnknownOpcode, 'Unknown opcode');
        }

        if (!packet.d || typeof packet.d !== 'object' || Array.isArray(packet.d)) {
            return connection.close(Close.DecodeError, 'Invalid payload');
        }

        this.identify(connection, packet.d as Record<string, unknown>);
    };

    private onClose = (connection: GatewaySocket, code: number) => {
        this.connections.delete(connection);

        const session = connection.session;

        if (!session || !session.detach(connection)) {
            return;
        }

        this.destroySession(session);
    };

    private maintain = () => {
        const now = Date.now();

        for (const [ip, attempt] of this.attempts) {
            if (attempt.until < now) {
                this.attempts.delete(ip);
            }
        }

        for (const session of this.sessions.values()) {
            if (session.hasExpired(now)) {
                this.invalidate(session, 'SESSION_EXPIRED');
            }
        }

        for (const connection of this.connections) {
            if (connection.hasMissedHeartbeat(Gateway.heartbeatInterval, now)) {
                if (connection.session?.connection === connection) {
                    this.destroySession(connection.session);
                }

                connection.close(Close.SessionTimedOut, 'Heartbeat timed out');
            }
        }
    };

    private verifyConnection(
        request: IncomingMessage,
        done: (accepted: boolean, code?: number, message?: string) => void
    ) {
        if (this.disposed) {
            return done(false, 503, 'Service unavailable');
        }

        const origin = request.headers.origin;

        if (origin ? !allowedOrigins.includes(origin) : !request.headers.authorization?.startsWith('Bearer ')) {
            done(false, 403, 'Forbidden');

            return;
        }

        const ip = request.socket.remoteAddress ?? 'unknown';
        const now = Date.now();
        const previous = this.attempts.get(ip);
        const attempt =
            previous && previous.until > now
                ? previous
                : {
                      count: 0,
                      until: now + 60000
                  };

        attempt.count++;

        this.attempts.set(ip, attempt);

        if (attempt.count > 120 || this.connections.size >= 1000) {
            return done(false, 429, 'Too Many Requests');
        }

        done(true);
    }

    private getToken(request: IncomingMessage): string | null {
        const cookie = request.headers.cookie
            ?.split(';')
            .map((value) => value.trim())
            .find((value) => value.startsWith(`${SESSION_COOKIE}=`));

        if (cookie) {
            try {
                return decodeURIComponent(cookie.slice(SESSION_COOKIE.length + 1));
            } catch {
                return 'invalid';
            }
        }

        const authorization = request.headers.authorization;

        return authorization?.startsWith('Bearer ') ? authorization.slice(7) : null;
    }
}

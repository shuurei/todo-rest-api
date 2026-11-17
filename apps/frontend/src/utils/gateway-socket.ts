import {
    GatewayOpcode as Op,
    GatewayCloseCode as Close,
    type GatewayDispatch,
    type GatewayServerPacket
} from '@todo/shared';
import type { User } from '@/types/user';

interface SocketHandlers {
    hello: () => void;
    dispatch: (packet: GatewayDispatch<User>) => void;
    close: (code: number, reason: string) => void;
    reconnect: () => void;
    latency: (milliseconds: number) => void;
}

export class GatewaySocket {
    private readonly socket: WebSocket;
    private readonly handlers: SocketHandlers;
    private readonly watchdog: ReturnType<typeof setInterval>;

    private handshakeTimer: ReturnType<typeof setTimeout> | undefined;
    private heartbeatTimer: ReturnType<typeof setTimeout> | undefined;

    private heartbeatInterval = 30000;
    private heartbeatSentAt = 0;
    private lastMessage = Date.now();
    private acknowledged = true;
    private helloReceived = false;
    private disposed = false;

    constructor(url: string, handlers: SocketHandlers) {
        this.socket = new WebSocket(url);
        this.handlers = handlers;

        this.handshakeTimer = setTimeout(() => this.fail(), 30000);
        this.watchdog = setInterval(this.checkHealth, 5000);

        document.addEventListener('visibilitychange', this.checkHealth);

        this.socket.onmessage = this.onMessage;
        this.socket.onclose = (event) => this.fail(event.code, event.reason);
        this.socket.onerror = () => {};
    }

    send(op: number, data: unknown = null) {
        if (!this.disposed && this.socket.readyState === WebSocket.OPEN) {
            this.socket.send(JSON.stringify({ op, d: data }));
        }
    }

    completeHandshake() {
        clearTimeout(this.handshakeTimer);
    }

    dispose(code = 1000) {
        if (this.disposed) {
            return;
        }

        this.disposed = true;

        clearTimeout(this.handshakeTimer);
        clearTimeout(this.heartbeatTimer);
        clearInterval(this.watchdog);

        document.removeEventListener('visibilitychange', this.checkHealth);

        this.socket.onmessage = null;
        this.socket.onclose = null;

        if (this.socket.readyState < WebSocket.CLOSING) {
            this.socket.close(code);
        }
    }

    private fail(code: number = Close.UnknownError, reason = '') {
        if (this.disposed) {
            return;
        }

        this.dispose();

        this.handlers.close(code, reason);
    }

    private heartbeat(requested = false) {
        if (!requested && !this.acknowledged) {
            return this.fail();
        }

        this.acknowledged = false;

        this.heartbeatSentAt = performance.now();

        this.send(Op.Heartbeat);
    }

    private tick = () => {
        if (this.disposed) {
            return;
        }

        this.heartbeat();

        if (!this.disposed) {
            this.heartbeatTimer = setTimeout(this.tick, this.heartbeatInterval);
        }
    };

    private checkHealth = () => {
        if (!this.disposed && Date.now() - this.lastMessage > this.heartbeatInterval * 2.5) {
            this.fail();
        }
    };

    private onMessage = (event: MessageEvent) => {
        if (this.disposed) {
            return;
        }

        this.lastMessage = Date.now();

        try {
            const packet = JSON.parse(event.data) as GatewayServerPacket<User>;
            if (!packet || !Number.isInteger(packet.op)) {
                throw new Error('Invalid envelope');
            }

            switch (packet.op) {
                case Op.Hello: {
                    const interval = packet.d?.heartbeat_interval;

                    if (this.helloReceived || !Number.isFinite(interval) || interval < 1000 || interval > 120000) {
                        throw new Error('Invalid HELLO');
                    }

                    this.helloReceived = true;
                    this.heartbeatInterval = interval;
                    this.heartbeatTimer = setTimeout(this.tick, Math.random() * interval);
                    this.handlers.hello();

                    break;
                }

                case Op.Heartbeat: {
                    return this.heartbeat(true);
                }

                case Op.HeartbeatAck: {
                    if (!this.acknowledged) {
                        this.handlers.latency(Math.round(performance.now() - this.heartbeatSentAt));
                    }

                    this.acknowledged = true;
                    break;
                }

                case Op.Reconnect: {
                    return this.handlers.reconnect();
                }

                case Op.Dispatch: {
                    if (!this.helloReceived) {
                        throw new Error('Dispatch before HELLO');
                    }

                    this.handlers.dispatch(packet);
                    break;
                }

                default: {
                    throw new Error('Unknown opcode');
                }
            }
        } catch {
            this.fail(Close.DecodeError);
        }
    };
}

import { GatewayOpcode as Op, GatewayCloseCode as Close, fatalGatewayCloseCodes, gatewayVersion, type GatewayDispatch, type GatewayTodo, type GatewaySession, type GatewayUserProfile, type SessionIssue } from '@todo/shared'
import type { User } from '@/types/user'
import { api } from '@/utils/axios'
import { GatewaySocket } from './gateway-socket'

export interface GatewayState {
    status: 'connecting' | 'offline' | 'ready' | 'fatal';
    initialized: boolean;
    user: User | null;
    users: Record<string, GatewayUserProfile>;
    issue: SessionIssue;
    todos: GatewayTodo[];
    sessions: GatewaySession[];
    retryAt: number | null;
    latency: number | null;
    closeCode: number | null;
}

type Topic = 'todos';

export class Gateway {
    private static state: GatewayState = {
        status: 'connecting',
        initialized: false,
        user: null,
        users: {},
        issue: null,
        todos: [],
        sessions: [],
        retryAt: null,
        latency: null,
        closeCode: null
    };

    private static readonly listeners = new Set<() => void>();
    private static readonly topics = new Map<Topic, Set<symbol>>();

    private static socket: GatewaySocket | null = null;
    private static retryTimer: ReturnType<typeof setTimeout> | undefined;
    private static started = false;
    private static anonymous = false;

    static getSnapshot = () => {
        return Gateway.state;
    };

    static subscribe = (listener: () => void) => {
        this.listeners.add(listener);

        return () => {
            this.listeners.delete(listener);
        };
    };

    static start() {
        if (this.started) {
            return;
        }

        this.started = true;

        window.addEventListener('online', this.onOnline);
        window.addEventListener('offline', this.onOffline);

        queueMicrotask(() => this.connect());
    }

    static reconnect() {
        this.anonymous = false;

        this.update({ status: 'connecting', issue: null });

        this.connect();
    }

    static subscribeTopic(topic: Topic) {
        const consumers = this.topics.get(topic) ?? new Set<symbol>();
        const first = consumers.size === 0;
        const consumer = Symbol(topic);

        consumers.add(consumer);

        this.topics.set(topic, consumers);

        if (first && this.state.status === 'ready' && this.state.user) {
            this.socket?.send(Op.Subscribe, topic);
        }

        return () => {
            if (!consumers.delete(consumer)) {
                return;
            }

            queueMicrotask(() => {
                if (consumers.size || this.topics.get(topic) !== consumers) {
                    return;
                }

                this.topics.delete(topic);

                this.update({ todos: [] });

                if (this.state.status === 'ready') {
                    this.socket?.send(Op.Unsubscribe, topic);
                }
            });
        };
    }

    static dismissIssue() {
        this.update({ issue: null });
    }

    private static update(patch: Partial<GatewayState>) {
        this.state = {
            ...this.state,
            ...patch
        };

        this.listeners.forEach((listener) => listener());
    }

    static stop() {
        this.started = false;

        clearTimeout(this.retryTimer);

        window.removeEventListener('online', this.onOnline);
        window.removeEventListener('offline', this.onOffline);

        this.detach();
    }

    private static detach() {
        this.socket?.dispose();
        this.socket = null;
    }

    private static socketUrl() {
        const apiUrl = new URL(api.defaults.baseURL ?? '/api', window.location.href);
        const url = new URL('/', apiUrl.origin);

        if (!['http:', 'https:'].includes(url.protocol)) {
            throw new Error('Invalid API URL');
        }

        url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
        url.searchParams.set('v', String(gatewayVersion));
        url.searchParams.set('encoding', 'json');

        return url.href;
    }

    private static connect() {
        if (!this.started || this.state.status === 'fatal') {
            return;
        }

        clearTimeout(this.retryTimer);

        this.detach();
        this.update({ status: 'connecting', retryAt: null });

        try {
            this.socket = new GatewaySocket(this.socketUrl(), {
                hello: () => this.socket?.send(Op.Identify, { anonymous: this.anonymous }),
                dispatch: (packet) => this.dispatch(packet),
                close: (code, reason) => this.onClose(code, reason),
                reconnect: () => this.schedule(0),
                latency: (latency) => this.update({ latency })
            });
        } catch {
            this.schedule();
        }
    }

    private static schedule(delay = 5000) {
        this.detach();

        clearTimeout(this.retryTimer);

        if (!this.started) {
            return;
        }

        this.update({ status: 'offline', retryAt: Date.now() + delay });

        this.retryTimer = setTimeout(() => this.connect(), delay);
    }

    private static fatal(code: number) {
        this.detach();

        clearTimeout(this.retryTimer);

        this.update({
            status: 'fatal',
            retryAt: null,
            closeCode: code
        });
    }

    private static revoke(code: string) {
        this.update({
            user: null,
            users: {},
            todos: [],
            sessions: [],
            issue: code === 'LOGGED_OUT' ? null : code === 'USER_DISABLED' ? 'disabled' : 'expired'
        });
    }

    private static onClose(code: number, reason: string) {
        this.update({ closeCode: code });

        if (code === Close.AuthenticationFailed) {
            if (this.anonymous) {
                return this.fatal(code);
            }

            this.anonymous = true;

            this.revoke(reason);
            this.schedule(0);
        } else if (fatalGatewayCloseCodes.includes(code)) {
            this.fatal(code);
        } else {
            this.schedule();
        }
    }

    private static dispatch(packet: GatewayDispatch<User>) {
        switch (packet.t) {
            case 'READY': {
                if (packet.d.v !== gatewayVersion) {
                    return this.fatal(Close.InvalidVersion);
                }

                this.socket?.completeHandshake();

                this.update({
                    status: 'ready',
                    initialized: true,
                    retryAt: null,
                    closeCode: null,
                    user: packet.d.user,
                    users: Object.fromEntries(packet.d.users.map((user) => [user.id, user])),
                    issue: packet.d.user ? null : this.state.issue,
                    todos: packet.d.todos,
                    sessions: packet.d.sessions
                });

                if (packet.d.user) {
                    for (const [topic, consumers] of this.topics) {
                        if (consumers.size) {
                            this.socket?.send(Op.Subscribe, topic);
                        }
                    }
                }

                break;
            }

            case 'CURRENT_USER_UPDATE': {
                if (String(this.state.user?.id) === String(packet.d.id)) {
                    this.update({
                        user: packet.d
                    });
                }

                break;
            }

            case 'USER_UPDATE': {
                return this.update({
                    users: {
                        ...this.state.users,
                        [packet.d.id]: packet.d
                    }
                });
            }

            case 'TODO_LIST_UPDATE': {
                if (this.topics.get('todos')?.size) {
                    this.update({
                        todos: packet.d
                    });
                }

                break;
            }

            case 'SESSIONS_UPDATE': {
                return this.update({
                    sessions: packet.d
                });
            }
            
            case 'SESSION_REVOKED': {
                return this.revoke(packet.d.code);
            }
        }
    }

    private static onOnline = () => {
        if (this.state.status === 'offline') {
            return this.connect();
        }
    };

    private static onOffline = () => {
        if (this.socket) {
            return this.schedule();
        }
    };
}

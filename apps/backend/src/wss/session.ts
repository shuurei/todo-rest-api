import { randomUUID } from 'node:crypto';
import { GatewayCloseCode as Close, GatewayOpcode as Op, type GatewayDispatchData } from '@nodus/shared';
import type { GatewaySocket } from './socket';

interface SessionOptions {
    userId: string | number | null;
    authSessionId: string | null;
    authExpiresAt: number;
    onError: (error: Error) => void;
}

export class GatewaySession {
    readonly id = randomUUID();
    readonly userId: string | null;
    readonly authSessionId: string | null;
    readonly authExpiresAt: number;
    private peer: GatewaySocket | null = null;
    private queue: Promise<void> = Promise.resolve();
    private destroyed = false;
    private ready = false;
    private readonly pending = new Set<string>();
    private readonly subscriptions = new Set<string>();
    private readonly onError: SessionOptions['onError'];

    constructor(options: SessionOptions) {
        this.userId = options.userId == null ? null : String(options.userId);

        this.authSessionId = options.authSessionId;

        this.authExpiresAt = options.authExpiresAt;

        this.onError = options.onError;
    }

    get connection() {
        return this.peer;
    }

    get isConnected() {
        return this.peer?.isOpen ?? false;
    }

    get isDestroyed() {
        return this.destroyed;
    }

    get isReady() {
        return this.ready;
    }

    hasExpired(now: number) {
        return this.authExpiresAt <= now;
    }

    attach(connection: GatewaySocket) {
        this.peer?.close(Close.UnknownError, 'Connection replaced');

        this.peer = connection;

        connection.session = this;
    }

    detach(connection: GatewaySocket) {
        if (this.peer !== connection) {
            return false;
        }

        this.peer = null;

        connection.session = null;

        return true;
    }

    isSubscribed(topic: string) {
        return this.subscriptions.has(topic);
    }

    subscribe(topic: string) {
        this.subscriptions.add(topic);
    }

    unsubscribe(topic: string) {
        this.subscriptions.delete(topic);
    }

    dispatch<Name extends keyof GatewayDispatchData>(t: Name, d: GatewayDispatchData[Name]) {
        if (this.destroyed) {
            return;
        }

        if (t === 'READY') {
            this.ready = true;
        }

        this.peer?.send(
            JSON.stringify({
                op: Op.Dispatch,
                d,
                t
            })
        );
    }

    enqueue(task: () => Promise<void>) {
        this.queue = this.queue
            .then(async () => {
                if (!this.destroyed) {
                    await task();
                }
            })
            .catch(this.onError);
    }

    enqueueChange(key: string, task: () => Promise<void>) {
        if (this.destroyed || this.pending.has(key)) {
            return;
        }

        this.pending.add(key);

        this.enqueue(async () => {
            this.pending.delete(key);

            await task();
        });
    }

    destroy() {
        this.destroyed = true;

        if (this.peer?.session === this) {
            this.peer.session = null;
        }

        this.peer = null;

        this.pending.clear();
    }
}

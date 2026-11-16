import type { IncomingMessage } from 'node:http';
import { WebSocket, type RawData } from 'ws';
import { GatewayOpcode as Op, GatewayCloseCode as Close } from '@todo/shared';
import type { GatewaySession } from './session';

interface ConnectionHandlers {
    message: (
        connection: GatewaySocket,
        packet: {
            op: number;
            d: unknown;
        }
    ) => void;
    close: (connection: GatewaySocket, code: number) => void;
}

export class GatewaySocket {
    private readonly socket: WebSocket;
    private readonly handshakeTimeout: ReturnType<typeof setTimeout>;
    private lastHeartbeat = Date.now();
    private rate = {
        count: 0,
        until: Date.now() + 60000
    };
    readonly request: IncomingMessage;
    session: GatewaySession | null = null;
    identifying = false;

    constructor(socket: WebSocket, request: IncomingMessage, handlers: ConnectionHandlers) {
        this.socket = socket;

        this.request = request;

        this.handshakeTimeout = setTimeout(() => this.close(Close.NotAuthenticated, 'Identify required'), 30000);

        socket.on('error', () => this.dispose());

        socket.on('message', (raw, binary) => {
            const packet = this.decode(raw, binary);

            if (!packet) {
                return;
            }

            if (packet.op === Op.Heartbeat) {
                if (packet.d !== null) {
                    return this.close(Close.DecodeError, 'Heartbeat payload must be null');
                }

                this.lastHeartbeat = Date.now();

                return this.control(Op.HeartbeatAck);
            }

            handlers.message(this, packet);
        });

        socket.on('close', (code) => {
            this.completeHandshake();

            handlers.close(this, code);
        });
    }

    get isOpen() {
        return this.socket.readyState === WebSocket.OPEN;
    }

    send(json: string) {
        if (!this.isOpen) {
            return;
        }

        if (this.socket.bufferedAmount > 1024 * 1024) {
            return this.close(Close.RateLimited, 'Slow client');
        }

        this.socket.send(json);
    }

    control(op: number, d: unknown = null) {
        this.send(
            JSON.stringify({
                op,
                d,
                s: null,
                t: null
            })
        );
    }

    completeHandshake() {
        clearTimeout(this.handshakeTimeout);
    }

    hasMissedHeartbeat(interval: number, now: number) {
        return now - this.lastHeartbeat > interval * 2.5;
    }

    close(code: number, reason: string) {
        this.socket.close(code, reason);
    }

    dispose() {
        this.completeHandshake();

        this.socket.terminate();
    }

    private decode(raw: RawData, binary: boolean) {
        if (binary || Buffer.byteLength(raw.toString()) > 4096) {
            return this.close(Close.DecodeError, 'JSON payload required, max 4096 bytes');
        }

        const now = Date.now();

        if (now > this.rate.until) {
            this.rate = {
                count: 0,
                until: now + 60000
            };
        }

        if (++this.rate.count > 120) {
            return this.close(Close.RateLimited, 'Rate limited');
        }

        try {
            const packet = JSON.parse(raw.toString());

            if (!packet || typeof packet !== 'object' || !Number.isInteger(packet.op)) {
                throw new Error();
            }

            return packet;
        } catch {
            return this.close(Close.DecodeError, 'Invalid JSON envelope');
        }
    }
}

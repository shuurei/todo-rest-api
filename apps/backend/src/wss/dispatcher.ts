import type { ServiceEvent } from './events';
import { gatewayEvents } from './events';
import type { GatewaySession } from './session';
import type { GatewayHandler, GatewayHandlerContext, GatewaySnapshot } from './handlers/handler';
import { UserGatewayHandler } from './handlers/user.handler';
import { TodoGatewayHandler } from './handlers/todo.handler';
import { DevicesGatewayHandler } from './handlers/devices.handler';

export class GatewayDispatcher {
    private readonly handlers: GatewayHandler[];
    private readonly routes = new Map<ServiceEvent['type'], GatewayHandler[]>();
    private readonly context: GatewayHandlerContext;
    private disposed = false;

    private readonly onServiceEvent = (change: ServiceEvent) => this.dispatch(change);

    constructor(context: GatewayHandlerContext) {
        this.context = context;

        gatewayEvents.on('change', this.onServiceEvent);

        this.handlers = [new UserGatewayHandler(context), new TodoGatewayHandler(), new DevicesGatewayHandler(context)];

        for (const handler of this.handlers) {
            for (const event of handler.events) {
                const route = this.routes.get(event) ?? [];

                route.push(handler);

                this.routes.set(event, route);
            }
        }
    }

    async snapshot(session: GatewaySession): Promise<GatewaySnapshot> {
        const initial: GatewaySnapshot = {
            user: null,
            users: [],
            todos: [],
            sessions: []
        };

        if (!session.userId) {
            return initial;
        }

        return Object.assign(
            initial,
            ...(await Promise.all(this.handlers.map((handler) => handler.snapshot(session))))
        );
    }

    async subscribe(session: GatewaySession, topic: string) {
        if (this.disposed || topic !== 'todos') {
            return false;
        }

        session.subscribe(topic);

        await (this.handlers.find((handler) => handler instanceof TodoGatewayHandler) as TodoGatewayHandler).subscribe(
            session
        );

        return true;
    }

    unsubscribe(session: GatewaySession, topic: string) {
        session.unsubscribe(topic);
    }

    onConnected(session: GatewaySession) {
        if (!this.disposed) {
            for (const handler of this.handlers) {
                handler.onConnected?.(session);
            }
        }
    }

    onDisconnected(session: GatewaySession) {
        if (!this.disposed) {
            for (const handler of this.handlers) {
                handler.onDisconnected?.(session);
            }
        }
    }

    dispose() {
        if (this.disposed) {
            return;
        }

        this.disposed = true;

        gatewayEvents.off('change', this.onServiceEvent);

        this.routes.clear();
    }

    dispatch(change: ServiceEvent) {
        if (this.disposed) {
            return;
        }

        change = {
            ...change,
            userId: String(change.userId)
        };

        const handlers = this.routes.get(change.type);

        if (!handlers) {
            return;
        }

        for (const session of this.context.sessions()) {
            if (session.isDestroyed || !session.userId) {
                continue;
            }

            for (const handler of handlers) {
                handler.onChange(session, change);
            }
        }
    }
}

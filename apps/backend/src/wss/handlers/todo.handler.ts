import { TodoService } from '../../services/todo.service';
import type { ServiceEvent } from '../events';
import type { GatewaySession } from '../session';
import type { GatewayHandler, GatewaySnapshot } from './handler';

export class TodoGatewayHandler implements GatewayHandler {
    readonly events = ['TODOS_CHANGED'] as const;

    async snapshot(session: GatewaySession): Promise<Partial<GatewaySnapshot>> {
        return {
            todos: session.userId && session.isSubscribed('todos') ? await this.list(session.userId) : []
        };
    }

    async subscribe(session: GatewaySession) {
        if (!session.userId) {
            return;
        }

        const todos = await this.list(session.userId);

        if (session.isSubscribed('todos')) {
            session.dispatch('TODO_LIST_UPDATE', todos);
        }
    }

    onChange(session: GatewaySession, change: ServiceEvent) {
        if (change.type !== 'TODOS_CHANGED' || session.userId !== change.userId || !session.isSubscribed('todos')) {
            return;
        }

        session.enqueueChange(`${change.type}:${change.userId}`, async () => {
            session.dispatch('TODO_LIST_UPDATE', await this.list(change.userId));
        });
    }

    private async list(userId: string) {
        return (
            await TodoService.repo.findBy({
                userId
            })
        ).map((todo) => ({
            id: todo.id,
            title: todo.title,
            isCompleted: todo.isCompleted,
            createdAt: todo.createdAt.toISOString(),
            updatedAt: todo.updatedAt.toISOString()
        }));
    }
}

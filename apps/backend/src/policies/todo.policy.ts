import type { User } from '../entities/user.entity'

export class TodoPolicy {
    static list(actor: User, userId: string) {
        return actor.id === userId;
    }

    static create(actor: User, userId: string) {
        return actor.id === userId;
    }

    static update(actor: User, userId: string) {
        return actor.id === userId;
    }

    static delete(actor: User, userId: string) {
        return actor.id === userId;
    }
}

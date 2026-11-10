import { hasFlag, UserFlags } from '@todo/shared'
import type { User } from '../entities/user.entity'

export class UserPolicy {
    static update(actor: User, user: User) {
        return actor.id === user.id || hasFlag(actor.flags, UserFlags.ADMIN);
    }

    static updatePreferences(actor: User, user: User) {
        return actor.id === user.id;
    }

    static delete(actor: User, user: User) {
        return actor.id === user.id || hasFlag(actor.flags, UserFlags.ADMIN);
    }
}

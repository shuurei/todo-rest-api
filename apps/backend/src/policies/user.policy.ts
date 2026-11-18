import { hasFlag, UserFlags } from '@nodus/shared';
import type { User } from '../entities/user.entity';

export class UserPolicy {
    static async visibleProfileIds(actor: Pick<User, 'id'>): Promise<string[]> {
        return [String(actor.id)];
    }

    static async viewProfile(actor: Pick<User, 'id'>, user: Pick<User, 'id'>): Promise<boolean> {
        return (await UserPolicy.visibleProfileIds(actor)).includes(String(user.id));
    }

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

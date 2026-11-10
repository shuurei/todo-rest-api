import { hasFlag, UserFlags } from '@todo/shared'
import type { User } from '../entities/user.entity'

export class AdminPolicy {
    static manageUsers(actor: User) {
        return hasFlag(actor.flags, UserFlags.ADMIN);
    }
}

import { normalizeUserPreferences } from '@nodus/shared';
import { AuthService } from '../../services/auth.service';
import { UserService } from '../../services/user.service';
import { UserPolicy } from '../../policies/user.policy';
import type { User } from '../../entities/user.entity';
import type { ServiceEvent } from '../events';
import type { GatewaySession } from '../session';
import type { GatewayHandler, GatewayHandlerContext, GatewaySnapshot } from './handler';

export class UserGatewayHandler implements GatewayHandler {
    readonly events = ['USER_CHANGED', 'PROFILE_PERMISSIONS_CHANGED'] as const;
    private readonly context: GatewayHandlerContext;

    constructor(context: GatewayHandlerContext) {
        this.context = context;
    }

    async snapshot(session: GatewaySession): Promise<Partial<GatewaySnapshot>> {
        if (!session.userId) {
            return {
                user: null,
                users: []
            };
        }

        const [user, authSession] = await Promise.all([
            UserService.findForAuthentication(session.userId),
            AuthService.repo.findOneBy({
                userId: session.userId,
                id: session.authSessionId
            })
        ]);

        if (!user || user.isDisabled || !authSession || authSession.expiresAt <= new Date()) {
            this.context.invalidate(session, user?.isDisabled ? 'USER_DISABLED' : 'SESSION_EXPIRED');

            return {
                user: null,
                users: []
            };
        }

        return {
            user: this.currentUser(user),
            users: await this.profilesFor(session.userId)
        };
    }

    onChange(session: GatewaySession, change: ServiceEvent) {
        const own = session.userId === change.userId;

        if (change.type === 'PROFILE_PERMISSIONS_CHANGED' && own) {
            this.context.reset(session);
        } else if (change.type === 'USER_CHANGED') {
            session.enqueueChange(`${change.type}:${change.userId}`, async () => {
                const profileAllowed = await UserPolicy.viewProfile(
                    {
                        id: session.userId
                    },
                    {
                        id: change.userId
                    }
                );

                if (!own && !profileAllowed) {
                    return;
                }

                const user = await UserService.findForAuthentication(change.userId);

                if (own) {
                    if (!user || user.isDisabled) {
                        return this.context.invalidate(session, user?.isDisabled ? 'USER_DISABLED' : 'SESSION_EXPIRED');
                    }

                    session.dispatch('CURRENT_USER_UPDATE', this.currentUser(user));
                } else if (profileAllowed) {
                    session.dispatch('USER_UPDATE', this.publicProfile(user));
                }
            });
        }
    }

    private async profilesFor(userId: string) {
        const actor = {
            id: userId
        };
        const ids = await UserPolicy.visibleProfileIds(actor);
        const candidates = (await Promise.all(ids.map((id) => UserService.findForAuthentication(id)))).filter(
            (user) => user && !user.isDisabled
        );
        const allowed = await Promise.all(candidates.map((user) => UserPolicy.viewProfile(actor, user)));

        return candidates.filter((_user, index) => allowed[index]).map((user) => this.publicProfile(user));
    }

    private currentUser(user: User) {
        return {
            id: String(user.id),
            username: user.username,
            displayName: user.displayName,
            flags: user.flags,
            isDisabled: user.isDisabled,
            preferences: normalizeUserPreferences(user.preferences),
            createdAt: user.createdAt,
            updatedAt: user.updatedAt
        };
    }

    private publicProfile(user: User) {
        return {
            id: String(user.id),
            username: user.username,
            displayName: user.displayName,
            avatar:
                (
                    user as User & {
                        avatar?: string | null;
                    }
                ).avatar ?? null
        };
    }
}

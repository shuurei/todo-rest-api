import { type GatewaySession as DeviceSession } from '@todo/shared';
import { AuthService } from '../../services/auth.service';
import { emitGatewayEvent, type ServiceEvent } from '../events';
import type { GatewaySession } from '../session';
import type { GatewayHandler, GatewayHandlerContext, GatewaySnapshot } from './handler';

export class DevicesGatewayHandler implements GatewayHandler {
    readonly events = ['SESSIONS_CHANGED', 'SESSION_REVOKED'] as const;
    private readonly context: GatewayHandlerContext;

    constructor(context: GatewayHandlerContext) {
        this.context = context;
    }

    async snapshot(session: GatewaySession): Promise<Partial<GatewaySnapshot>> {
        return {
            sessions: session.userId ? await this.list(session) : []
        };
    }

    onChange(session: GatewaySession, change: ServiceEvent) {
        if (session.userId !== change.userId) {
            return;
        }

        if (change.type === 'SESSION_REVOKED') {
            if (!change.sessionId || session.authSessionId === change.sessionId) {
                return this.context.invalidate(session, change.code ?? 'SESSION_EXPIRED');
            }
        } else if (change.type === 'SESSIONS_CHANGED') {
            session.enqueueChange(`${change.type}:${change.userId}`, async () => {
                session.dispatch('SESSIONS_UPDATE', await this.list(session));
            });
        }
    }

    onConnected(session: GatewaySession) {
        this.presenceChanged(session);
    }

    onDisconnected(session: GatewaySession) {
        this.presenceChanged(session);
    }

    private presenceChanged(session: GatewaySession) {
        if (session.userId) {
            emitGatewayEvent({
                type: 'SESSIONS_CHANGED',
                userId: session.userId
            });
        }
    }

    private async list(session: GatewaySession): Promise<DeviceSession[]> {
        const sessions = await AuthService.listSessions(session.userId, session.authSessionId);
        const active = [...this.context.sessions()];

        return sessions.map((device) => ({
            ...device,
            onlineConnections: active.filter(
                (other) => other.userId === session.userId && other.authSessionId === device.id && other.isConnected
            ).length
        }));
    }
}

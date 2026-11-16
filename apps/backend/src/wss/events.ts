import { EventEmitter } from 'node:events';

export interface ServiceEvent {
    type: 'TODOS_CHANGED' | 'SESSIONS_CHANGED' | 'USER_CHANGED' | 'SESSION_REVOKED' | 'PROFILE_PERMISSIONS_CHANGED';
    userId: string;
    sessionId?: string;
    code?: 'SESSION_EXPIRED' | 'USER_DISABLED' | 'LOGGED_OUT';
}

export const gatewayEvents = new EventEmitter();

export function emitGatewayEvent(event: ServiceEvent) {
    gatewayEvents.emit('change', event);
}

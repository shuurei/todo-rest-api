import type { GatewayReady } from '@todo/shared';
import type { ServiceEvent } from '../events';
import type { GatewaySession } from '../session';

export type GatewaySnapshot = Omit<GatewayReady<unknown>, 'v'>;

export interface GatewayHandlerContext {
    sessions: () => Iterable<GatewaySession>;
    invalidate: (session: GatewaySession, code: NonNullable<ServiceEvent['code']>) => void;
    reset: (session: GatewaySession) => void;
}

export interface GatewayHandler {
    readonly events: readonly ServiceEvent['type'][];
    snapshot(session: GatewaySession): Promise<Partial<GatewaySnapshot>>;
    onChange(session: GatewaySession, change: ServiceEvent): void;
    onConnected?(session: GatewaySession): void;
    onDisconnected?(session: GatewaySession): void;
}

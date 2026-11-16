import { useSyncExternalStore } from 'react';
import { Gateway as gateway } from '@/utils/gateway';

export function useGateway() {
    return useSyncExternalStore(gateway.subscribe, gateway.getSnapshot);
}

export function useUserProfile(userId: string) {
    return useGateway().users[String(userId)] ?? null;
}

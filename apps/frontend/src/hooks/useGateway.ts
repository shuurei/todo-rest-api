import { useSyncExternalStore } from 'react';
import { Gateway as gateway } from '@/utils/gateway';

export const useGateway = () => {
    return useSyncExternalStore(gateway.subscribe, gateway.getSnapshot);
}

export const useUserProfile = (userId: string) => {
    return useGateway().users[String(userId)] ?? null;
}

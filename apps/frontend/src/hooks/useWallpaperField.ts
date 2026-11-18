import { useSyncExternalStore } from 'react';
import { getHomeWallpaperField, type HomeWallpaperMode } from '@nodus/shared';

const subscribe = (listener: () => void) => {
    window.addEventListener('resize', listener);
    return () => window.removeEventListener('resize', listener);
};
const getScreenWidth = () => window.innerWidth >= 1024 ? 1024 : window.innerWidth >= 640 ? 640 : 0;

export function useWallpaperField(mode: HomeWallpaperMode) {
    const width = useSyncExternalStore(subscribe, getScreenWidth, () => 1024);
    return getHomeWallpaperField(mode, width);
}

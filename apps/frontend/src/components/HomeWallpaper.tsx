import { useState } from 'react';
import { getWallpaperUrl } from '@/utils/wallpaper';

export default function HomeWallpaper({
    wallpaper,
    blur,
    previewUrl
}: {
    wallpaper: string | null;
    blur: number;
    previewUrl?: string | null;
}) {
    const [failedSource, setFailedSource] = useState<string | null>(null);
    const source = previewUrl ?? getWallpaperUrl(wallpaper);

    if (!source || failedSource === source) {
        return null;
    }

    return (
        <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
            <div
                className="absolute -inset-12"
                style={{
                    filter: `blur(${blur}px)`
                }}
            >
                <img
                    src={source}
                    alt=""
                    referrerPolicy="no-referrer"
                    draggable={false}
                    onError={() => setFailedSource(source)}
                    className="h-full w-full object-cover"
                />
            </div>
            <div className="absolute inset-0 bg-black/35" />
        </div>
    );
}

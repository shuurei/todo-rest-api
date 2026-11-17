import { useState } from 'react'
import { getWallpaperUrl } from '@/utils/wallpaper'

interface HomeWallpaper {
    wallpaper: string | null;
    blur: number;
}

export default function HomeWallpaper({ wallpaper, blur }: HomeWallpaper) {
    const [failedSource, setFailedSource] = useState<string | null>(null);

    const source = getWallpaperUrl(wallpaper);
    if (!source || failedSource === source) return

    return (
        <div aria-hidden className='pointer-events-none absolute inset-0 overflow-hidden'>
            <div
                className='absolute -inset-12'
                style={{ filter: `blur(${blur}px)` }}
            >
                <img
                    src={source}
                    referrerPolicy='no-referrer'
                    draggable={false}
                    onError={() => setFailedSource(source)}
                    className='h-full w-full object-cover'
                />
            </div>
            <div className='absolute inset-0 bg-black/35' />
        </div>
    );
}

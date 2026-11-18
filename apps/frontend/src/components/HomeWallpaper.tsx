import { useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { getWallpaperUrl } from '@/utils/wallpaper';
import { useTheme } from '@/contexts/ThemeContext';

interface HomeWallpaperProps {
    wallpaper: string | null;
    blur: number;
}

export default function HomeWallpaper({ wallpaper, blur }: HomeWallpaperProps) {
    const [failedSource, setFailedSource] = useState<string | null>(null);
    const [loaded, setLoaded] = useState<{ source: string; blink: boolean } | null>(null);
    const { claimWallpaperReveal } = useTheme();
    const reduceMotion = useReducedMotion();
    const source = getWallpaperUrl(wallpaper);
    if (!source || failedSource === source) return null;
    const shouldBlink = loaded?.source === source && loaded.blink && !reduceMotion;

    return <motion.div
        key={source}
        aria-hidden
        initial={{ opacity: 0 }}
        animate={{ opacity: loaded?.source !== source ? 0 : shouldBlink ? [0, 1, 1, 0, 1, 0, 1] : 1 }}
        transition={{ duration: shouldBlink ? 0.27 : 0, times: [0, 0.15, 0.3, 0.45, 0.6, 0.75, 1] }}
        className='pointer-events-none absolute inset-0 z-0 overflow-hidden'
    >
        <div className='absolute -inset-12' style={{ filter: `blur(${blur}px)` }}>
            <img
                src={source}
                referrerPolicy='no-referrer'
                draggable={false}
                onLoad={() => setLoaded({ source, blink: claimWallpaperReveal(source) })}
                onError={() => setFailedSource(source)}
                className='h-full w-full object-cover'
            />
        </div>
        <div className='absolute inset-0 bg-black/35' />
    </motion.div>;
}

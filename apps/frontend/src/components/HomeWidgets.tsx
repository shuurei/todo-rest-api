import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { HomeWidgetSize, WeatherLocation } from '@nodus/shared';
import WeatherWidget from '@/components/WeatherWidget';
import { cn } from '@/utils/cn';

interface HomeWidgetsProps {
    widget: 'clock' | 'weather';
    size: HomeWidgetSize;
    weatherLocation: WeatherLocation | null;
    hasWallpaper: boolean;
}

export default function HomeWidgets({ widget, size, weatherLocation, hasWallpaper }: HomeWidgetsProps) {
    const { i18n } = useTranslation();
    const [now, setNow] = useState(() => new Date());

    useEffect(() => {
        if (widget !== 'clock') return;
        const update = () => setNow(new Date());
        update();
        const interval = window.setInterval(update, 1000);
        document.addEventListener('visibilitychange', update);
        return () => {
            window.clearInterval(interval);
            document.removeEventListener('visibilitychange', update);
        };
    }, [widget]);

    if (widget === 'weather' && !weatherLocation) return null;

    const card = cn(
        'flex h-full min-w-0 flex-col gap-2 overflow-y-auto border border-theme-border/30 p-3',
        hasWallpaper && 'bg-theme-surface/90'
    );

    return <div className='max-w-full shrink-0' style={{ width: Number(size[0]) * 88, height: 176 }}>
        {widget === 'clock' ? <section className={cn(card, 'items-center justify-center')}>
            <time dateTime={now.toISOString()} className='flex flex-col items-center gap-3'>
                <span className={cn('font-light tabular-nums tracking-tight text-theme-highlight', size === '2x2' ? 'text-2xl' : 'text-3xl')}>
                    {new Intl.DateTimeFormat(i18n.resolvedLanguage, {
                        hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23'
                    }).format(now)}
                </span>
                <span className='text-center text-xs capitalize leading-relaxed text-theme-text'>
                    {new Intl.DateTimeFormat(i18n.resolvedLanguage, {
                        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
                    }).format(now)}
                </span>
            </time>
        </section> : <WeatherWidget location={weatherLocation!} className={card} />}
    </div>;
}

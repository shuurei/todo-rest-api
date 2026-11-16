import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { WeatherLocation } from '@todo/shared';
import WeatherWidget from '@/components/WeatherWidget';
import { cn } from '@/utils/cn';

export default function HomeWidgets({
    showClock,
    showWeather,
    weatherLocation,
    hasWallpaper
}: {
    showClock: boolean;
    showWeather: boolean;
    weatherLocation: WeatherLocation | null;
    hasWallpaper: boolean;
}) {
    const { t, i18n } = useTranslation();
    const [now, setNow] = useState(() => new Date());

    useEffect(() => {
        if (!showClock) {
            return;
        }

        const update = () => setNow(new Date());

        update();

        const interval = window.setInterval(update, 1000);

        document.addEventListener('visibilitychange', update);

        return () => {
            window.clearInterval(interval);

            document.removeEventListener('visibilitychange', update);
        };
    }, [showClock]);

    if (!showClock && !showWeather) {
        return null;
    }

    const card = cn(
        'flex min-w-0 flex-col gap-3 border border-theme-border/30 p-4 sm:p-5',
        hasWallpaper && 'bg-theme-surface/90'
    );

    return (
        <div
            className={cn(
                'relative mx-auto grid w-full gap-3',
                showClock && showWeather ? 'max-w-2xl grid-cols-1 sm:grid-cols-2' : 'max-w-sm grid-cols-1'
            )}
        >
            {showClock && (
                <section className={card}>
                    <h2 className="text-[10px] uppercase tracking-widest text-theme-muted">{t('home.dateTime')}</h2>
                    <time dateTime={now.toISOString()} className="flex flex-col gap-3">
                        <span className="text-3xl font-light tabular-nums tracking-tight text-theme-highlight sm:text-4xl">
                            {new Intl.DateTimeFormat(i18n.resolvedLanguage, {
                                hour: '2-digit',
                                minute: '2-digit',
                                second: '2-digit',
                                hourCycle: 'h23'
                            }).format(now)}
                        </span>
                        <span className="text-sm capitalize leading-relaxed text-theme-text">
                            {new Intl.DateTimeFormat(i18n.resolvedLanguage, {
                                weekday: 'long',
                                day: 'numeric',
                                month: 'long',
                                year: 'numeric'
                            }).format(now)}
                        </span>
                    </time>
                </section>
            )}
            {showWeather && <WeatherWidget location={weatherLocation} className={card} />}
        </div>
    );
}

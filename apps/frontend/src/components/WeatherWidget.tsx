import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { LuCloud, LuCloudLightning, LuCloudRain, LuSnowflake, LuSun } from 'react-icons/lu'
import { getWeather, weatherCondition, weatherRefreshInterval, type WeatherData } from '@/utils/weather'
import type { WeatherLocation } from '@todo/shared'

interface WeatherWidgetProps {
    location: WeatherLocation;
    className: string;
}

export default function WeatherWidget({ location, className }: WeatherWidgetProps) {
    const { t, i18n } = useTranslation();

    const [data, setData] = useState<WeatherData | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(false);
    const [revision, setRevision] = useState(0);

    const latitude = location?.latitude;
    const longitude = location?.longitude;

    useEffect(() => {
        setData(null);
        setError(false);

        if (latitude === undefined || longitude === undefined) return;

        const controller = new AbortController();

        let running = false;

        const update = async () => {
            if (document.hidden || running) return;

            running = true;

            setLoading(true);

            try {
                const result = await getWeather(latitude!, longitude!, controller.signal);

                if (!controller.signal.aborted) {
                    setData(result);
                    setError(false);
                }
            } catch {
                if (!controller.signal.aborted) {
                    setError(true);
                }
            } finally {
                running = false;

                if (!controller.signal.aborted) {
                    setLoading(false);
                }
            }
        }

        update();

        const interval = window.setInterval(() => update(), weatherRefreshInterval);

        const onVisible = () => {
            if (!document.hidden) {
                update();
            }
        };

        document.addEventListener('visibilitychange', onVisible);

        return () => {
            controller.abort();
            window.clearInterval(interval);
            document.removeEventListener('visibilitychange', onVisible);
        };
    }, [latitude, longitude, revision]);

    const condition = data ? weatherCondition(data.code) : 'unknown';
    const Icon =
        condition === 'clear'
            ? LuSun
            : condition === 'storm'
                ? LuCloudLightning
                : condition === 'snow'
                    ? LuSnowflake
                    : condition === 'rain' || condition === 'drizzle'
                        ? LuCloudRain
                        : LuCloud;

    return (
        <section className={className} aria-busy={loading}>
            <p className='text-xs text-theme-muted'>{location.name}</p>
            {data && (
                <>
                    <div className="flex items-center gap-3 text-theme-highlight">
                        <Icon aria-hidden size={28} className="shrink-0" />
                        <span className="text-3xl tabular-nums">
                            {new Intl.NumberFormat(i18n.resolvedLanguage, {
                                maximumFractionDigits: 0
                            }).format(data.temperature)}
                            °C
                        </span>
                    </div>
                    <p className="text-sm text-theme-text">{t(`weather.conditions.${condition}`)}</p>
                </>
            )}
            {loading && !data && (
                <p role='status' className="text-xs text-theme-muted">
                    {t('common.loading')}
                </p>
            )}
            {error && (
                <div className="flex flex-col gap-2">
                    <p role="status" className="text-xs text-theme-muted">
                        {t('weather.unavailable')}
                    </p>
                    <button
                        type="button"
                        disabled={loading}
                        onClick={() => setRevision((value) => value + 1)}
                        className="min-h-11 cursor-pointer self-start text-xs text-theme-highlight underline disabled:opacity-50"
                    >
                        {t('weather.retry')}
                    </button>
                </div>
            )}
        </section>
    );
}

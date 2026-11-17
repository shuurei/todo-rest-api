import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { defaultUserPreferences, maxWallpaperBlur } from '@todo/shared'
import { UserAPI } from '@/api/UserAPI'
import { getWallpaperUrl, maxWallpaperBytes } from '@/utils/wallpaper'
import Button from '@/components/common/Button'
import Checkbox from '@/components/common/Checkbox'
import { useThemePreview } from '@/contexts/ThemeContext'
import WeatherLocationPicker from '@/components/WeatherLocationPicker'
import { useAuth } from '@/contexts/AuthContext'
import { translateError } from '@/i18n'
import { getApiErrorCode } from '@/utils/api-error'

export default function HomeSettingsPage() {
    const { user } = useAuth();
    const { t } = useTranslation();
    const { getUser } = useAuth();

    const [choice, setChoice] = useState<'none' | 'image'>(() => (user?.preferences.homeWallpaper ? 'image' : 'none'));
    const [imageId, setImageId] = useState(user?.preferences.homeWallpaper ?? null);
    const [file, setFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    useEffect(() => {
        return () => {
            if (previewUrl) URL.revokeObjectURL(previewUrl);
        };
    }, [previewUrl]);

    const fileInput = useRef<HTMLInputElement>(null);

    const [dynamicTheme, setDynamicTheme] = useState(user?.preferences.themeFromWallpaper);
    const [blur, setBlur] = useState(user?.preferences.homeWallpaperBlur);
    const [showClock, setShowClock] = useState(user?.preferences.homeShowClock);
    const [showWeather, setShowWeather] = useState(user?.preferences.homeShowWeather);
    const [weatherLocation, setWeatherLocation] = useState(user?.preferences.homeWeatherLocation);
    const [isPending, setIsPending] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [saved, setSaved] = useState(false);

    const wallpaper = choice === 'none' ? null : imageId;
    const imageSource = choice === 'image' ? previewUrl ?? getWallpaperUrl(imageId) : null;

    function removeWallpaper() {
        setChoice('none');
        setImageId(null);
        setFile(null);
        setPreviewUrl(null);
        setDynamicTheme(false);

        if (fileInput.current) fileInput.current.value = '';

        markChanged();
    }

    const cancelWallpaper = () => {
        setPreviewUrl(null);
        setFile(null);
    }

    useThemePreview({
        homeWallpaper: wallpaper,
        themeFromWallpaper: dynamicTheme
    });

    const isDirty =
        (choice === 'image' && !!file) ||
        wallpaper !== user?.preferences.homeWallpaper ||
        blur !== user?.preferences.homeWallpaperBlur ||
        dynamicTheme !== user?.preferences.themeFromWallpaper ||
        showClock !== user?.preferences.homeShowClock ||
        showWeather !== user?.preferences.homeShowWeather ||
        JSON.stringify(weatherLocation) !== JSON.stringify(user?.preferences.homeWeatherLocation);

    const markChanged = () => {
        setSaved(false);
        setError(null);
    };

    async function handleSubmit(event: React.SubmitEvent<HTMLFormElement>) {
        event.preventDefault();

        if (isPending || !isDirty || (choice === 'image' && !imageId && !file)) return;

        setIsPending(true);
        setError(null);
        setSaved(false);

        try {
            const { data } = await UserAPI.updatePreferences({
                homeWallpaper: wallpaper,
                homeWallpaperBlur: blur,
                themeFromWallpaper: dynamicTheme,
                homeShowClock: showClock,
                homeShowWeather: showWeather,
                homeWeatherLocation: weatherLocation
            }, choice === 'image' ? file : null);

            const current = getUser();
            if (!user || current?.id !== user?.id) return;

            setImageId(data.homeWallpaper);
            setFile(null);
            setPreviewUrl(null);

            if (fileInput.current) {
                fileInput.current.value = '';
            }

            setSaved(true);
        } catch (failure) {
            setError(getApiErrorCode(failure));
        } finally {
            setIsPending(false);
        }
    }

    return (
        <div className='flex flex-col gap-6'>
            <h1 className='text-xl font-bold tracking-tight'>{t('homeSettings.title')}</h1>
            <form onSubmit={handleSubmit} aria-busy={isPending} className="flex flex-col gap-6">
                <fieldset disabled={isPending} className="flex min-w-0 flex-col gap-6 disabled:opacity-60">
                    <div className="flex flex-col gap-3">
                        <span className="text-xs font-bold uppercase tracking-widest text-theme-highlight">
                            {t('homeSettings.wallpaper')}
                        </span>
                        <button
                            type="button"
                            onClick={() => fileInput.current?.click()}
                            aria-label={t('homeSettings.uploadImage')}
                            aria-describedby="wallpaper-help"
                            className="relative aspect-video w-full cursor-pointer overflow-hidden border border-theme-border/30 bg-theme-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-theme-accent"
                        >
                            {imageSource ? (
                                <div
                                    className='absolute -inset-12'
                                    style={{ filter: `blur(${blur}px)` }}
                                >
                                    <img
                                        src={imageSource}
                                        alt={t('homeSettings.wallpaper')}
                                        referrerPolicy="no-referrer"
                                        draggable={false}
                                        className="h-full w-full object-cover"
                                    />
                                </div>
                            ) : (
                                <span className="text-sm text-theme-muted">{t('homeSettings.uploadImage')}</span>
                            )}
                        </button>
                        <input
                            ref={fileInput}
                            id="wallpaper-file"
                            name="homeWallpaper"
                            type="file"
                            accept="image/jpeg,image/png,image/webp,image/gif"
                            className="hidden"
                            onChange={(event) => {
                                const selected = event.target.files?.[0];
                                if (!selected) return;

                                if (selected.size > maxWallpaperBytes) {
                                    event.target.value = '';
                                    setError('WALLPAPER_TOO_LARGE');
                                    return;
                                }

                                setFile(selected);
                                setPreviewUrl(URL.createObjectURL(selected));
                                setChoice('image');

                                markChanged();
                            }}
                        />

                        <div className='flex gap-2'>
                            {choice === 'image' && (file || imageId) && (
                                <Button
                                    type='button'
                                    onClick={removeWallpaper}
                                    className="min-h-9 w-auto self-start border border-theme-border/30 px-3 text-xs text-theme-muted"
                                >
                                    {t('homeSettings.removeWallpaper')}
                                </Button>
                            )}

                            {choice === 'image' && previewUrl && (
                                <Button
                                    type='button'
                                    onClick={cancelWallpaper}
                                    className='min-h-9 w-auto self-start border border-theme-border/30 px-3 text-xs text-theme-muted'
                                >
                                    {t('common.cancel')}
                                </Button>
                            )}
                        </div>
                    </div>

                    <div className="flex flex-col gap-3">
                        <label
                            htmlFor="home-wallpaper-blur"
                            className="flex items-center justify-between gap-3 text-xs font-bold uppercase tracking-widest text-theme-highlight"
                        >
                            <span>{t('homeSettings.blur')}</span>
                            <span className="text-theme-muted">{(((blur ?? 0) * 100) / maxWallpaperBlur).toFixed(2)} %</span>
                        </label>

                        <div className="relative flex min-h-11 items-center border border-theme-border/30 px-4">
                            <span
                                aria-hidden="true"
                                className="pointer-events-none absolute left-1/2 top-1/2 h-3 w-px -translate-x-1/2 -translate-y-1/2 bg-theme-muted"
                            />
                            <input
                                id="home-wallpaper-blur"
                                className="wallpaper-blur-slider relative min-h-11 w-full cursor-pointer appearance-none bg-transparent focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-theme-accent"
                                type="range"
                                min={0}
                                max={maxWallpaperBlur}
                                step={1}
                                value={blur}
                                onChange={(event) => {
                                    setBlur(Number(event.target.value));
                                    markChanged();
                                }}
                            />
                        </div>
                    </div>

                    <fieldset className="flex min-w-0 flex-col gap-3 border border-theme-border/30 p-4">
                        <legend className="px-2 text-xs font-bold uppercase tracking-widest text-theme-highlight">
                            {t('homeSettings.widgets')}
                        </legend>
                        <Checkbox
                            className="min-h-11 w-full"
                            label={t('homeSettings.showClock')}
                            checked={showClock}
                            onChange={(event) => {
                                setShowClock(event.target.checked);
                                markChanged();
                            }}
                        />

                        <Checkbox
                            className="min-h-11 w-full"
                            label={t('homeSettings.showWeather')}
                            checked={showWeather}
                            onChange={(event) => {
                                setShowWeather(event.target.checked);

                                markChanged();
                            }}
                        />

                        {showWeather && (
                            <WeatherLocationPicker
                                value={weatherLocation ?? null}
                                disabled={isPending}
                                onChange={(location) => {
                                    setWeatherLocation(location);
                                    markChanged();
                                }}
                            />
                        )}
                    </fieldset>

                    <div className="flex flex-wrap gap-3">
                        <Button
                            type="submit"
                            disabled={!isDirty || (choice === 'image' && !imageId && !file)}
                            className="min-h-12 w-auto border border-theme-accent bg-theme-accent text-theme-surface"
                        >
                            {t(isPending ? 'common.saving' : 'common.saveChanges')}
                        </Button>

                        <Button
                            type="button"
                            className="min-h-12 w-auto border border-theme-border/30 text-theme-muted"
                            onClick={() => {
                                removeWallpaper();
                                setBlur(defaultUserPreferences.homeWallpaperBlur);
                                setShowClock(defaultUserPreferences.homeShowClock);
                                setShowWeather(defaultUserPreferences.homeShowWeather);
                                setWeatherLocation(defaultUserPreferences.homeWeatherLocation);
                                markChanged();
                            }}
                        >
                            {t('settings.restoreDefaults')}
                        </Button>
                    </div>
                </fieldset>

                {error && (
                    <p role="alert" className="text-xs text-red-400">
                        {translateError(error)}
                    </p>
                )}

                {saved && (
                    <p role="status" className="text-xs text-theme-highlight">
                        {t('settings.saved')}
                    </p>
                )}
            </form>
        </div>
    );
}

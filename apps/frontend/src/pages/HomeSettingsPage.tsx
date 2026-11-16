import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { defaultUserPreferences, maxWallpaperBlur } from '@todo/shared';
import { UserAPI } from '@/api/UserAPI';
import { maxWallpaperBytes } from '@/utils/wallpaper';
import Button from '@/components/common/Button';
import Checkbox from '@/components/common/Checkbox';
import HomeWallpaper from '@/components/HomeWallpaper';
import { useThemePreview } from '@/contexts/ThemeContext';
import WeatherLocationPicker from '@/components/WeatherLocationPicker';
import { useAuth } from '@/contexts/AuthContext';
import { translateError } from '@/i18n';
import { getApiErrorCode } from '@/utils/api-error';

export default function HomeSettingsPage() {
    const { user } = useAuth();
    const { t } = useTranslation();
    const { getUser } = useAuth();
    const [choice, setChoice] = useState<'none' | 'image'>(() => (user?.preferences.homeWallpaper ? 'image' : 'none'));
    const [imageId, setImageId] = useState(user?.preferences.homeWallpaper ?? null);
    const [file, setFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const fileInput = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (!file) {
            setPreviewUrl(null);

            return;
        }

        const url = URL.createObjectURL(file);

        setPreviewUrl(url);

        return () => URL.revokeObjectURL(url);
    }, [file]);

    const [dynamicTheme, setDynamicTheme] = useState(user?.preferences.themeFromWallpaper);
    const [blur, setBlur] = useState(user?.preferences.homeWallpaperBlur);
    const [showClock, setShowClock] = useState(user?.preferences.homeShowClock);
    const [showWeather, setShowWeather] = useState(user?.preferences.homeShowWeather);
    const [weatherLocation, setWeatherLocation] = useState(user?.preferences.homeWeatherLocation);
    const [isPending, setIsPending] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [saved, setSaved] = useState(false);
    const wallpaper = choice === 'none' ? null : imageId;

    useThemePreview({
        homeWallpaper: wallpaper,
        themeFromWallpaper: dynamicTheme,
        wallpaperPreviewUrl: choice === 'image' && file ? previewUrl : null
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

        if (isPending || !isDirty || (choice === 'image' && !imageId && !file)) {
            return;
        }

        setIsPending(true);

        setError(null);

        setSaved(false);

        try {
            const { data } = await UserAPI.updatePreferences(
                {
                    homeWallpaper: wallpaper,
                    homeWallpaperBlur: blur,
                    themeFromWallpaper: dynamicTheme,
                    homeShowClock: showClock,
                    homeShowWeather: showWeather,
                    homeWeatherLocation: weatherLocation
                },
                choice === 'image' ? file : null
            );
            const current = getUser();

            if (!user || current?.id !== user?.id) {
                return;
            }

            setImageId(data.homeWallpaper);

            setFile(null);

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
        <div className="flex flex-col gap-6">
            <h1 className="text-xl font-bold tracking-tight">{t('homeSettings.title')}</h1>
            <form onSubmit={handleSubmit} aria-busy={isPending} className="flex flex-col gap-6">
                <fieldset disabled={isPending} className="flex min-w-0 flex-col gap-6 disabled:opacity-60">
                    <fieldset className="min-w-0">
                        <legend className="mb-3 text-xs font-bold uppercase tracking-widest text-theme-highlight">
                            {t('homeSettings.wallpaper')}
                        </legend>
                        <div className="grid grid-cols-2 gap-3">
                            {(['none', 'image'] as const).map((value) => (
                                <label
                                    key={value}
                                    className="relative flex min-h-24 cursor-pointer items-end overflow-hidden border border-theme-border/30 bg-theme-surface p-3 has-checked:border-theme-accent has-checked:ring-1 has-checked:ring-theme-accent has-focus-visible:ring-2 has-focus-visible:ring-theme-accent"
                                >
                                    {value === 'image' && (
                                        <HomeWallpaper
                                            wallpaper={imageId}
                                            previewUrl={file ? previewUrl : null}
                                            blur={0}
                                        />
                                    )}
                                    <input
                                        type="radio"
                                        name="home-wallpaper"
                                        value={value}
                                        checked={choice === value}
                                        onChange={() => {
                                            setChoice(value);

                                            if (value === 'none') {
                                                setDynamicTheme(false);
                                            }

                                            markChanged();
                                        }}
                                        className="peer sr-only"
                                    />
                                    <span className="relative rounded-sm bg-theme-surface/90 px-2 py-1 text-xs text-theme-text peer-checked:text-theme-highlight">
                                        {t(`homeSettings.wallpapers.${value}`)}
                                    </span>
                                </label>
                            ))}
                        </div>
                    </fieldset>

                    {choice === 'image' && (
                        <div className="flex flex-col gap-3">
                            <label
                                htmlFor="wallpaper-file"
                                className="text-xs font-bold uppercase tracking-widest text-theme-highlight"
                            >
                                {t('homeSettings.uploadImage')}
                            </label>
                            <input
                                ref={fileInput}
                                id="wallpaper-file"
                                name="homeWallpaper"
                                type="file"
                                accept="image/jpeg,image/png,image/webp,image/gif"
                                required={!imageId && !file}
                                className="min-w-0 text-sm text-theme-text"
                                onChange={(event) => {
                                    const selected = event.target.files?.[0] ?? null;

                                    if (selected && selected.size > maxWallpaperBytes) {
                                        event.target.value = '';

                                        setFile(null);

                                        setError('WALLPAPER_TOO_LARGE');

                                        return;
                                    }

                                    setFile(selected);

                                    markChanged();
                                }}
                            />
                            <p className="text-xs text-theme-muted">{t('homeSettings.uploadHelp')}</p>
                        </div>
                    )}

                    <div className="flex flex-col gap-3">
                        <Checkbox
                            label={t('homeSettings.dynamicTheme')}
                            checked={dynamicTheme}
                            disabled={choice === 'none'}
                            onChange={(event) => {
                                setDynamicTheme(event.target.checked);

                                markChanged();
                            }}
                        />
                        <p className="text-xs text-theme-muted">{t('homeSettings.dynamicHelp')}</p>
                    </div>

                    <div className="flex flex-col gap-3">
                        <label
                            htmlFor="home-wallpaper-blur"
                            className="flex items-center justify-between gap-3 text-xs font-bold uppercase tracking-widest text-theme-highlight"
                        >
                            {t('homeSettings.blur')}
                            <span className="text-theme-muted">{blur} px</span>
                        </label>
                        <input
                            id="home-wallpaper-blur"
                            type="range"
                            min={0}
                            max={maxWallpaperBlur}
                            step={1}
                            value={blur}
                            onChange={(event) => {
                                setBlur(Number(event.target.value));

                                markChanged();
                            }}
                            className="min-h-11 w-full accent-theme-accent"
                        />
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

                        {showWeather && weatherLocation && (
                            <WeatherLocationPicker
                                value={weatherLocation}
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
                                setChoice('none');

                                setImageId(null);

                                setFile(null);

                                if (fileInput.current) {
                                    fileInput.current.value = '';
                                }

                                setDynamicTheme(false);

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

                <div className="flex flex-col gap-3 border-t border-theme-border/20 pt-5">
                    <p className="text-xs leading-relaxed text-theme-muted">{t('homeSettings.orderHelp')}</p>
                </div>
            </form>
        </div>
    );
}

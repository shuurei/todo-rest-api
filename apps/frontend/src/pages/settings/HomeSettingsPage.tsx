import { useEffect, useRef, useState, type ChangeEvent } from 'react'
import { useTranslation } from 'react-i18next'

import { defaultUserPreferences, maxWallpaperBlur, type UserPreferences } from '@todo/shared'

import WeatherLocationPicker from '@/components/WeatherLocationPicker'
import Button from '@/components/common/Button'
import Checkbox from '@/components/common/Checkbox'
import SettingsForm from '@/components/settings/SettingsForm'
import FormActionsSection from '@/components/settings/FormActionsSection'

import { useThemePreview } from '@/contexts/ThemeContext'
import { useAuth } from '@/contexts/AuthContext'

import { getWallpaperUrl, maxWallpaperBytes } from '@/utils/wallpaper'
import { UserAPI } from '@/api/UserAPI'
import ScrambleText from '@/components/ScrambleText'

interface WallpaperSectionProps {
    imageSource: string | null;
    blur: number | undefined;
    canRemove: boolean;
    canCancel: boolean;
    onSelect: (file: File) => void;
    onRemove: () => void;
    onCancel: () => void;
}

const WallpaperSection = ({ imageSource, blur, canRemove, canCancel, onSelect, onRemove, onCancel }: WallpaperSectionProps) => {
    const { t } = useTranslation();
    const fileInput = useRef<HTMLInputElement>(null);

    const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
        const selected = event.target.files?.[0];
        event.target.value = '';

        if (!selected || selected.size > maxWallpaperBytes) return;

        onSelect(selected);
    }

    return (
        <div className='flex flex-col gap-3'>
            <div className='flex items-center justify-between gap-4 border-b border-theme-border/20 pb-3'>
                <ScrambleText
                    as='h2'
                    className='text-xs uppercase tracking-[0.2em] text-theme-muted'
                    text={t('homeSettings.wallpaper')}
                />
            </div>

            <button
                type='button'
                onClick={() => fileInput.current?.click()}
                aria-label={t('homeSettings.uploadImage')}
                className='relative aspect-video w-full cursor-pointer overflow-hidden border border-theme-border/30 bg-theme-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-theme-accent'
            >
                {imageSource ? (
                    <div className='absolute -inset-12' style={{ filter: `blur(${blur ?? 0}px)` }}>
                        <img
                            src={imageSource}
                            alt={t('homeSettings.wallpaper')}
                            referrerPolicy='no-referrer'
                            draggable={false}
                            className='h-full w-full object-cover'
                        />
                    </div>
                ) : (
                    <span className='text-sm text-theme-muted'>{t('homeSettings.uploadImage')}</span>
                )}
            </button>
            <input
                ref={fileInput}
                id='wallpaper-file'
                name='homeWallpaper'
                type='file'
                accept='image/jpeg,image/png,image/webp,image/gif'
                className='hidden'
                onChange={handleChange}
            />
            <div className='flex gap-2'>
                {canRemove && (
                    <Button
                        type='button'
                        onClick={onRemove}
                        className='min-h-9 w-auto self-start border border-theme-border/30 px-3 text-xs text-theme-muted'
                    >
                        {t('homeSettings.removeWallpaper')}
                    </Button>
                )}

                {canCancel && (
                    <Button
                        type='button'
                        onClick={onCancel}
                        className='min-h-9 w-auto self-start border border-theme-border/30 px-3 text-xs text-theme-muted'
                    >
                        {t('common.cancel')}
                    </Button>
                )}
            </div>
        </div>
    );
};

interface BlurSectionProps {
    blur: number | undefined;
    onChange: (blur: number) => void;
}

const BlurSection = ({ blur, onChange }: BlurSectionProps) => {
    const { t } = useTranslation();

    return (
        <div className='flex flex-col gap-3'>
            <div className='flex items-center justify-between gap-4 border-b border-theme-border/20 pb-3'>
                <ScrambleText
                    as='label'
                    htmlFor='home-wallpaper-blur'
                    className='text-xs uppercase tracking-[0.2em] text-theme-muted'
                    text={t('homeSettings.blur')}
                />

                <span className='text-theme-muted text-xs'>{(((blur ?? 0) * 100) / maxWallpaperBlur).toFixed(2)} %</span>
            </div>

            <div className='relative flex min-h-11 items-center border border-theme-border/30 px-4'>
                <input
                    id='home-wallpaper-blur'
                    className='wallpaper-blur-slider relative min-h-11 w-full cursor-pointer appearance-none bg-transparent'
                    type='range'
                    min={0}
                    max={maxWallpaperBlur}
                    step={1}
                    value={blur ?? 0}
                    onChange={(event) => onChange(Number(event.target.value))}
                />
            </div>
        </div>
    );
};

interface WidgetsSectionProps {
    showClock: boolean | undefined;
    showWeather: boolean | undefined;
    weatherLocation: UserPreferences['homeWeatherLocation'];
    isPending: boolean;
    onClockChange: (show: boolean) => void;
    onWeatherChange: (show: boolean) => void;
    onLocationChange: (location: UserPreferences['homeWeatherLocation']) => void;
}

const WidgetsSection = ({ showClock, showWeather, weatherLocation, isPending, onClockChange, onWeatherChange, onLocationChange }: WidgetsSectionProps) => {
    const { t } = useTranslation();

    return (
        <fieldset className='flex min-w-0 flex-col gap-3 border border-theme-border/30 p-4'>
            <ScrambleText
                as='legend'
                className='text-xs uppercase tracking-[0.2em] text-theme-muted'
                text={t('homeSettings.widgets')}
            />

            <Checkbox
                className='min-h-11 w-full'
                label={t('homeSettings.showClock')}
                checked={showClock}
                onChange={(event) => onClockChange(event.target.checked)}
            />
            
            <Checkbox
                className='min-h-11 w-full'
                label={t('homeSettings.showWeather')}
                checked={showWeather}
                onChange={(event) => onWeatherChange(event.target.checked)}
            />

            {showWeather && (
                <WeatherLocationPicker
                    value={weatherLocation}
                    disabled={isPending}
                    onChange={onLocationChange}
                />
            )}
        </fieldset>
    );
};

export default function HomeSettingsPage() {
    const { user, getUser } = useAuth();
    const { t } = useTranslation();

    const [choice, setChoice] = useState<'none' | 'image'>(() => (user?.preferences.homeWallpaper ? 'image' : 'none'));
    const [imageId, setImageId] = useState(user?.preferences.homeWallpaper ?? null);
    const [file, setFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    useEffect(() => {
        return () => {
            if (previewUrl) URL.revokeObjectURL(previewUrl);
        };
    }, [previewUrl]);

    const [dynamicTheme, setDynamicTheme] = useState(user?.preferences.themeFromWallpaper);
    const [blur, setBlur] = useState(user?.preferences.homeWallpaperBlur);
    const [showClock, setShowClock] = useState(user?.preferences.homeShowClock);
    const [showWeather, setShowWeather] = useState(user?.preferences.homeShowWeather);
    const [weatherLocation, setWeatherLocation] = useState(user?.preferences.homeWeatherLocation);
    const [isPending, setIsPending] = useState(false);

    const wallpaper = choice === 'none' ? null : imageId;
    const imageSource = choice === 'image' ? previewUrl ?? getWallpaperUrl(imageId) : null;

    const selectWallpaper = (selected: File) => {
        setFile(selected);
        setPreviewUrl(URL.createObjectURL(selected));
        setChoice('image');
    };

    const removeWallpaper = () => {
        setChoice('none');
        setImageId(null);
        setFile(null);
        setPreviewUrl(null);
        setDynamicTheme(false);
    };

    const cancelWallpaper = () => {
        setPreviewUrl(null);
        setFile(null);
        setChoice(imageId ? 'image' : 'none');
    };

    useThemePreview({
        homeWallpaper: wallpaper,
        wallpaperPreviewUrl: choice === 'image' ? previewUrl : null,
        themeFromWallpaper: dynamicTheme
    });

    const isDirty = (choice === 'image' && !!file)
        || wallpaper !== user?.preferences.homeWallpaper
        || blur !== user?.preferences.homeWallpaperBlur
        || dynamicTheme !== user?.preferences.themeFromWallpaper
        || showClock !== user?.preferences.homeShowClock
        || showWeather !== user?.preferences.homeShowWeather
        || JSON.stringify(weatherLocation) !== JSON.stringify(user?.preferences.homeWeatherLocation);

    const isDefault = !file
        && wallpaper === defaultUserPreferences.homeWallpaper
        && blur === defaultUserPreferences.homeWallpaperBlur
        && (!imageSource || dynamicTheme === defaultUserPreferences.themeFromWallpaper)
        && showClock === defaultUserPreferences.homeShowClock
        && showWeather === defaultUserPreferences.homeShowWeather
        && JSON.stringify(weatherLocation) === JSON.stringify(defaultUserPreferences.homeWeatherLocation);

    const savedPreferences = user?.preferences ?? defaultUserPreferences;
    const hasSavedChanges = savedPreferences.homeWallpaper !== defaultUserPreferences.homeWallpaper
        || savedPreferences.homeWallpaperBlur !== defaultUserPreferences.homeWallpaperBlur
        || (!!savedPreferences.homeWallpaper && savedPreferences.themeFromWallpaper !== defaultUserPreferences.themeFromWallpaper)
        || savedPreferences.homeShowClock !== defaultUserPreferences.homeShowClock
        || savedPreferences.homeShowWeather !== defaultUserPreferences.homeShowWeather
        || JSON.stringify(savedPreferences.homeWeatherLocation) !== JSON.stringify(defaultUserPreferences.homeWeatherLocation);

    const cancelChanges = () => {
        const preferences = user?.preferences ?? defaultUserPreferences;

        setChoice(preferences.homeWallpaper ? 'image' : 'none');
        setImageId(preferences.homeWallpaper);
        setFile(null);
        setPreviewUrl(null);
        setDynamicTheme(preferences.themeFromWallpaper);
        setBlur(preferences.homeWallpaperBlur);
        setShowClock(preferences.homeShowClock);
        setShowWeather(preferences.homeShowWeather);
        setWeatherLocation(preferences.homeWeatherLocation);
    };

    const restoreDefaults = () => {
        removeWallpaper();
        setDynamicTheme(defaultUserPreferences.themeFromWallpaper);
        setBlur(defaultUserPreferences.homeWallpaperBlur);
        setShowClock(defaultUserPreferences.homeShowClock);
        setShowWeather(defaultUserPreferences.homeShowWeather);
        setWeatherLocation(defaultUserPreferences.homeWeatherLocation);
    };

    const handleSubmit = async (event: React.SubmitEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (isPending || !isDirty || (choice === 'image' && !imageId && !file)) return;

        setIsPending(true);

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
        } catch (failure) {
            console.error('Failed to save home preferences', failure);
        } finally {
            setIsPending(false);
        }
    };

    return (
        <div className='flex flex-col gap-6'>
            <h1 className='text-xl font-bold tracking-tight'>{t('homeSettings.title')}</h1>
            <SettingsForm onSubmit={handleSubmit} isPending={isPending}>
                <WallpaperSection
                    imageSource={imageSource}
                    blur={blur}
                    canRemove={choice === 'image' && !!imageId}
                    canCancel={choice === 'image' && !!previewUrl}
                    onSelect={selectWallpaper}
                    onRemove={removeWallpaper}
                    onCancel={cancelWallpaper}
                />

                {imageSource && (
                    <BlurSection blur={blur} onChange={setBlur} />
                )}

                <WidgetsSection
                    showClock={showClock}
                    showWeather={showWeather}
                    weatherLocation={weatherLocation ?? null}
                    isPending={isPending}
                    onClockChange={setShowClock}
                    onWeatherChange={setShowWeather}
                    onLocationChange={setWeatherLocation}
                />

                <FormActionsSection
                    isPending={isPending}
                    canSave={isDirty && !(choice === 'image' && !imageId && !file)}
                    isDirty={isDirty}
                    canRestoreDefaults={hasSavedChanges && !isDefault}
                    onCancel={cancelChanges}
                    onRestoreDefaults={restoreDefaults}
                />
            </SettingsForm>
        </div>
    );
}

import { useRef, useState, type ChangeEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { motion, useReducedMotion } from 'motion/react'
import { LuImagePlus, LuTrash2, LuUndo2 } from 'react-icons/lu'
import { cn } from '@/utils/cn'

import {
    defaultUserPreferences, maxWallpaperBlur, homeWidgetPositions, homeWidgetSizes, homeWallpaperFields,
    type HomeWallpaperField, type HomeWallpaperMode,
    type HomeWidgetLayout, type HomeWidgetPosition, type HomeWidgetSize, type HomeAppsAlignment, type UserPreferences
} from '@nodus/shared'

import WeatherLocationPicker from '@/components/WeatherLocationPicker'
import Checkbox from '@/components/common/Checkbox'
import SettingsForm from '@/components/settings/SettingsForm'
import FormActionsSection from '@/components/settings/FormActionsSection'

import { useThemePreview } from '@/contexts/ThemeContext'
import { useAuth } from '@/contexts/AuthContext'

import { maxWallpaperBytes } from '@/utils/wallpaper'
import { useWallpaperDraft } from '@/hooks/useWallpaperDraft'
import { useWallpaperField } from '@/hooks/useWallpaperField'
import { UserAPI } from '@/api/UserAPI'
import ScrambleText from '@/components/ScrambleText'

const WallpaperPreviewImage = ({ source, label, blur }: { source: string; label: string; blur: number }) => {
    const [loaded, setLoaded] = useState(false);
    const reduceMotion = useReducedMotion();
    return <motion.img
        src={source}
        alt={label}
        referrerPolicy='no-referrer'
        draggable={false}
        onLoad={() => setLoaded(true)}
        initial={{ opacity: 0 }}
        animate={{ opacity: !loaded ? 0 : reduceMotion ? 1 : [0, 1, 1, 0, 1, 0, 1] }}
        transition={{ duration: reduceMotion ? 0 : 0.27, times: [0, 0.15, 0.3, 0.45, 0.6, 0.75, 1] }}
        style={{ filter: `blur(${blur * 0.2}px)` }}
        className='absolute -inset-2 h-[calc(100%+1rem)] w-[calc(100%+1rem)] object-cover'
    />;
};

interface WallpaperSectionProps {
    field: HomeWallpaperField;
    label: string;
    imageSource: string | null;
    blur: number | undefined;
    canRemove: boolean;
    canCancel: boolean;
    onSelect: (file: File) => void;
    onRemove: () => void;
    onCancel: () => void;
}

const WallpaperSection = ({ field, label, imageSource, blur, canRemove, canCancel, onSelect, onRemove, onCancel }: WallpaperSectionProps) => {
    const { t } = useTranslation();
    const fileInput = useRef<HTMLInputElement>(null);
    const isCommon = field === 'homeWallpaper';

    const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
        const selected = event.target.files?.[0];
        event.target.value = '';

        if (!selected || selected.size > maxWallpaperBytes) return;

        onSelect(selected);
    }

    return (
        <div className={cn('relative flex min-w-0 flex-col gap-3 border border-theme-border/30', !isCommon && 'bg-theme-surface/20 p-4')}>
            {(!isCommon || canCancel || canRemove) && <div className={cn(
                'flex items-center justify-between gap-4',
                isCommon ? 'absolute right-2 top-2 z-10 bg-theme-deep/80' : 'border-b border-theme-border/20 pb-3'
            )}>
                {!isCommon && <ScrambleText
                    as='h2'
                    className='text-xs uppercase tracking-[0.2em] text-theme-muted'
                    text={label}
                />}
                <div className='flex shrink-0 gap-1'>
                    {canCancel && <button type='button' onClick={onCancel}
                        aria-label={t('common.cancel')} title={t('common.cancel')}
                        className='flex size-9 cursor-pointer items-center justify-center text-theme-muted hover:text-theme-highlight'>
                        <LuUndo2 aria-hidden size={16} />
                    </button>}
                    {canRemove && <button type='button' onClick={onRemove}
                        aria-label={t('homeSettings.removeWallpaper')} title={t('homeSettings.removeWallpaper')}
                        className='flex size-9 cursor-pointer items-center justify-center text-theme-muted hover:text-red-400'>
                        <LuTrash2 aria-hidden size={16} />
                    </button>}
                </div>
            </div>}

            <div className={cn('flex items-center justify-center overflow-hidden', isCommon ? 'aspect-video w-full' : 'h-72 bg-theme-deep/30 p-3')}>
                <button
                    type='button'
                    onClick={() => fileInput.current?.click()}
                    aria-label={`${label} — ${t('homeSettings.uploadImage')}`}
                    className={cn(
                        'relative shrink-0 cursor-pointer overflow-hidden border-theme-muted/50 bg-theme-page shadow-xl transition-colors hover:border-theme-accent focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-theme-accent',
                        isCommon ? 'h-full w-full shadow-none' : field === 'homeWallpaperMobile' ? 'aspect-[9/19.5] h-64 max-w-full rounded-[1.4rem] border-[7px]'
                            : field === 'homeWallpaperTablet' ? 'aspect-[3/4] h-64 max-w-full rounded-xl border-[7px]'
                                : 'aspect-video w-full max-w-md rounded-md border-[6px]'
                    )}
                >
                    {imageSource && <WallpaperPreviewImage key={imageSource} source={imageSource} label={label} blur={blur ?? 0} />}
                    <div aria-hidden className='pointer-events-none absolute inset-0 bg-black/15'>
                        {field === 'homeWallpaperMobile' ? <div className='absolute left-1/2 top-1 h-2 w-9 -translate-x-1/2 rounded-full bg-black/80' />
                            : field === 'homeWallpaperTablet' ? <div className='absolute left-1/2 top-1 size-1 -translate-x-1/2 rounded-full bg-theme-muted' /> : null}
                        {!imageSource && <LuImagePlus className='absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-theme-muted/60' size={24} />}
                    </div>
                </button>
            </div>
            <input
                ref={fileInput}
                id={`wallpaper-${field}`}
                name={field}
                type='file'
                accept='image/jpeg,image/png,image/webp,image/gif'
                className='hidden'
                onChange={handleChange}
            />
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

type HomeDisplaySettings = Pick<UserPreferences, 'homeClockLayout' | 'homeWeatherLayout' | 'homeAppsAlignment'>;

const getDisplaySettings = (preferences: Readonly<UserPreferences>): HomeDisplaySettings => ({
    homeClockLayout: preferences.homeClockLayout,
    homeWeatherLayout: preferences.homeWeatherLayout,
    homeAppsAlignment: preferences.homeAppsAlignment
});

const selectClassName = 'min-h-11 w-full cursor-pointer border border-theme-border/30 bg-theme-surface px-3 text-sm text-theme-text';

const WidgetLayoutControls = ({ id, value, onChange }: {
    id: 'clock' | 'weather';
    value: HomeWidgetLayout;
    onChange: (value: HomeWidgetLayout) => void;
}) => {
    const { t } = useTranslation();
    return <fieldset className='flex min-w-0 flex-col gap-3 border border-theme-border/20 p-3'>
        <legend className='px-1 text-xs text-theme-muted'>{t(`home.${id}`)}</legend>
        <label htmlFor={`${id}-position`} className='flex flex-col gap-2 text-xs text-theme-muted'>
            {t('homeSettings.widgetPosition')}
            <select id={`${id}-position`} className={selectClassName} value={value.position}
                onChange={(event) => onChange({ ...value, position: event.target.value as HomeWidgetPosition })}>
                {homeWidgetPositions.map((position) => <option key={position} value={position}>
                    {t(`homeSettings.positions.${position}`)}
                </option>)}
            </select>
        </label>
        <label htmlFor={`${id}-size`} className='flex flex-col gap-2 text-xs text-theme-muted'>
            {t('homeSettings.widgetSize')}
            <select id={`${id}-size`} className={selectClassName} value={value.size}
                onChange={(event) => onChange({ ...value, size: event.target.value as HomeWidgetSize })}>
                {homeWidgetSizes.map((size) => <option key={size} value={size}>{size.replace('x', ' × ')}</option>)}
            </select>
        </label>
    </fieldset>;
};

interface WidgetsSectionProps {
    showClock: boolean | undefined;
    showWeather: boolean | undefined;
    weatherLocation: UserPreferences['homeWeatherLocation'];
    isPending: boolean;
    onClockChange: (show: boolean) => void;
    onWeatherChange: (show: boolean) => void;
    onLocationChange: (location: UserPreferences['homeWeatherLocation']) => void;
    display: HomeDisplaySettings;
    onDisplayChange: (display: HomeDisplaySettings) => void;
}

const WidgetsSection = ({ showClock, showWeather, weatherLocation, isPending, onClockChange, onWeatherChange, onLocationChange, display, onDisplayChange }: WidgetsSectionProps) => {
    const { t } = useTranslation();

    return (
        <fieldset disabled={isPending} className='flex min-w-0 flex-col gap-3 border border-theme-border/30 p-4'>
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

            {showClock && <WidgetLayoutControls id='clock' value={display.homeClockLayout}
                onChange={(value) => onDisplayChange({ ...display, homeClockLayout: value })} />}
            
            <Checkbox
                className='min-h-11 w-full'
                label={t('homeSettings.showWeather')}
                checked={showWeather}
                onChange={(event) => onWeatherChange(event.target.checked)}
            />

            {showWeather && <>
                <WidgetLayoutControls id='weather' value={display.homeWeatherLayout}
                    onChange={(value) => onDisplayChange({ ...display, homeWeatherLayout: value })} />
                <WeatherLocationPicker
                    value={weatherLocation}
                    disabled={isPending}
                    onChange={onLocationChange}
                />
            </>}
        </fieldset>
    );
};

export default function HomeSettingsPage() {
    const { user, getUser } = useAuth();
    const { t } = useTranslation();

    const savedPreferences = user?.preferences ?? defaultUserPreferences;
    const wallpapers = useWallpaperDraft(savedPreferences);
    const [wallpaperMode, setWallpaperMode] = useState(savedPreferences.homeWallpaperMode);
    const activeWallpaperField = useWallpaperField(wallpaperMode);
    const visibleWallpaperFields: HomeWallpaperField[] = wallpaperMode === 'split'
        ? ['homeWallpaperDesktop', 'homeWallpaperTablet', 'homeWallpaperMobile'] : ['homeWallpaper'];
    const hasImages = visibleWallpaperFields.some((field) => !!wallpapers.source(field));

    const [dynamicTheme, setDynamicTheme] = useState(user?.preferences.themeFromWallpaper);
    const [blur, setBlur] = useState(user?.preferences.homeWallpaperBlur);
    const [showClock, setShowClock] = useState(user?.preferences.homeShowClock);
    const [showWeather, setShowWeather] = useState(user?.preferences.homeShowWeather);
    const [weatherLocation, setWeatherLocation] = useState(user?.preferences.homeWeatherLocation);
    const [display, setDisplay] = useState(() => getDisplaySettings(user?.preferences ?? defaultUserPreferences));
    const [isPending, setIsPending] = useState(false);

    useThemePreview({
        ...wallpapers.values,
        homeWallpaperMode: wallpaperMode,
        wallpaperPreviewUrl: wallpapers.source(activeWallpaperField),
        themeFromWallpaper: dynamicTheme
    });

    const isDirty = wallpapers.dirty
        || wallpaperMode !== savedPreferences.homeWallpaperMode
        || blur !== user?.preferences.homeWallpaperBlur
        || dynamicTheme !== user?.preferences.themeFromWallpaper
        || showClock !== user?.preferences.homeShowClock
        || showWeather !== user?.preferences.homeShowWeather
        || JSON.stringify(display) !== JSON.stringify(getDisplaySettings(user?.preferences ?? defaultUserPreferences))
        || JSON.stringify(weatherLocation) !== JSON.stringify(user?.preferences.homeWeatherLocation);

    const isDefault = homeWallpaperFields.every((field) => !wallpapers.files[field] && wallpapers.values[field] === defaultUserPreferences[field])
        && wallpaperMode === defaultUserPreferences.homeWallpaperMode
        && blur === defaultUserPreferences.homeWallpaperBlur
        && (!hasImages || dynamicTheme === defaultUserPreferences.themeFromWallpaper)
        && showClock === defaultUserPreferences.homeShowClock
        && showWeather === defaultUserPreferences.homeShowWeather
        && JSON.stringify(display) === JSON.stringify(getDisplaySettings(defaultUserPreferences))
        && JSON.stringify(weatherLocation) === JSON.stringify(defaultUserPreferences.homeWeatherLocation);

    const hasSavedChanges = homeWallpaperFields.some((field) => savedPreferences[field] !== defaultUserPreferences[field])
        || savedPreferences.homeWallpaperMode !== defaultUserPreferences.homeWallpaperMode
        || savedPreferences.homeWallpaperBlur !== defaultUserPreferences.homeWallpaperBlur
        || (homeWallpaperFields.some((field) => !!savedPreferences[field]) && savedPreferences.themeFromWallpaper !== defaultUserPreferences.themeFromWallpaper)
        || savedPreferences.homeShowClock !== defaultUserPreferences.homeShowClock
        || savedPreferences.homeShowWeather !== defaultUserPreferences.homeShowWeather
        || JSON.stringify(getDisplaySettings(savedPreferences)) !== JSON.stringify(getDisplaySettings(defaultUserPreferences))
        || JSON.stringify(savedPreferences.homeWeatherLocation) !== JSON.stringify(defaultUserPreferences.homeWeatherLocation);

    const cancelChanges = () => {
        const preferences = user?.preferences ?? defaultUserPreferences;

        wallpapers.reset(preferences);
        setWallpaperMode(preferences.homeWallpaperMode);
        setDynamicTheme(preferences.themeFromWallpaper);
        setBlur(preferences.homeWallpaperBlur);
        setShowClock(preferences.homeShowClock);
        setShowWeather(preferences.homeShowWeather);
        setWeatherLocation(preferences.homeWeatherLocation);
        setDisplay(getDisplaySettings(preferences));
    };

    const restoreDefaults = () => {
        wallpapers.reset(defaultUserPreferences);
        setWallpaperMode(defaultUserPreferences.homeWallpaperMode);
        setDynamicTheme(defaultUserPreferences.themeFromWallpaper);
        setBlur(defaultUserPreferences.homeWallpaperBlur);
        setShowClock(defaultUserPreferences.homeShowClock);
        setShowWeather(defaultUserPreferences.homeShowWeather);
        setWeatherLocation(defaultUserPreferences.homeWeatherLocation);
        setDisplay(getDisplaySettings(defaultUserPreferences));
    };

    const handleSubmit = async (event: React.SubmitEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (isPending || !isDirty) return;

        setIsPending(true);

        try {
            const { data } = await UserAPI.updatePreferences({
                ...display,
                ...wallpapers.values,
                homeWallpaperMode: wallpaperMode,
                homeWallpaperBlur: blur,
                themeFromWallpaper: dynamicTheme,
                homeShowClock: showClock,
                homeShowWeather: showWeather,
                homeWeatherLocation: weatherLocation
            }, wallpapers.files);

            const current = getUser();
            if (!user || current?.id !== user?.id) return;

            wallpapers.reset(data);
            setWallpaperMode(data.homeWallpaperMode);
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
                <label htmlFor='wallpaper-mode' className='flex flex-col gap-2 text-xs text-theme-muted'>
                    {t('homeSettings.wallpaperMode')}
                    <select id='wallpaper-mode' className={selectClassName} value={wallpaperMode}
                        onChange={(event) => setWallpaperMode(event.target.value as HomeWallpaperMode)}>
                        <option value='everywhere'>{t('homeSettings.wallpaperEverywhere')}</option>
                        <option value='split'>{t('homeSettings.wallpaperSplit')}</option>
                    </select>
                </label>
                <div className={cn('grid gap-4', wallpaperMode === 'split' && 'xl:grid-cols-3')}>
                {visibleWallpaperFields.map((field) => <WallpaperSection
                    key={field}
                    field={field}
                    label={t(`homeSettings.wallpaperTargets.${field}`)}
                    imageSource={wallpapers.source(field)}
                    blur={blur}
                    canRemove={!!wallpapers.source(field)}
                    canCancel={!!wallpapers.files[field]}
                    onSelect={(file) => wallpapers.select(field, file)}
                    onRemove={() => wallpapers.remove(field)}
                    onCancel={() => wallpapers.cancel(field)}
                />)}
                </div>

                {hasImages && (
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
                    display={display}
                    onDisplayChange={setDisplay}
                />

                <fieldset disabled={isPending} className='flex min-w-0 flex-col gap-3 border border-theme-border/30 p-4'>
                    <legend className='text-xs uppercase tracking-[0.2em] text-theme-muted'>{t('home.applications')}</legend>
                    <label htmlFor='home-apps-alignment' className='flex flex-col gap-2 text-xs text-theme-muted'>
                        {t('homeSettings.appsAlignment')}
                        <select id='home-apps-alignment' className={selectClassName} value={display.homeAppsAlignment}
                            onChange={(event) => setDisplay({ ...display, homeAppsAlignment: event.target.value as HomeAppsAlignment })}>
                            <option value='left'>{t('homeSettings.appsLeft')}</option>
                            <option value='center'>{t('homeSettings.appsCenter')}</option>
                        </select>
                    </label>
                </fieldset>

                <FormActionsSection
                    isPending={isPending}
                    canSave={isDirty}
                    isDirty={isDirty}
                    canRestoreDefaults={hasSavedChanges && !isDefault}
                    onCancel={cancelChanges}
                    onRestoreDefaults={restoreDefaults}
                />
            </SettingsForm>
        </div>
    );
}

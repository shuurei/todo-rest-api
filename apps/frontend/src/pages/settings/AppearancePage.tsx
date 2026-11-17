import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { defaultUserPreferences, normalizeTransitionDuration, themeColors, transitionSpeeds, type ThemeColor, type UserPreferences } from '@todo/shared'
import { UserAPI } from '@/api/UserAPI'
import { useAuth } from '@/contexts/AuthContext'
import { useThemePreview } from '@/contexts/ThemeContext'
import SettingsForm from '@/components/settings/SettingsForm'
import FormActionsSection from '@/components/settings/FormActionsSection'
import { Controller, useForm, useWatch, type UseFormRegisterReturn } from 'react-hook-form'
import ScrambleText from '@/components/ScrambleText'
import { extractImagePalette, type ImagePalette } from '@/utils/image-palette'
import { getWallpaperUrl } from '@/utils/wallpaper'

interface AppearanceValues {
    theme: ThemeColor | 'auto';
    transitionDuration: UserPreferences['transitionDuration'];
}

const getAppearanceValues = (preferences: UserPreferences): AppearanceValues => ({
    theme: preferences.homeWallpaper && preferences.themeFromWallpaper ? 'auto' : preferences.themeColor,
    transitionDuration: normalizeTransitionDuration(preferences.transitionDuration)
});

const defaultValues = getAppearanceValues(defaultUserPreferences);

const themeSwatches: Record<ThemeColor, string> = {
    green: 'oklch(0.76 0.13 135)',
    blue: 'oklch(0.76 0.13 235)',
    purple: 'oklch(0.76 0.13 305)',
    amber: 'oklch(0.76 0.13 85)',
    black: '#171717',
    white: '#e5e5e5'
} as const;

interface ThemeChoiceProps {
    value: string;
    label: string;
    swatch: string;
    input: UseFormRegisterReturn<'theme'>;
}

const ThemeChoice = ({ value, label, swatch, input }: ThemeChoiceProps) => (
    <label className='group flex cursor-pointer items-center gap-4 border border-theme-border/20 bg-theme-surface/40 p-4 hover:border-theme-border/50 has-checked:border-theme-accent has-checked:bg-theme-border/10'>
        <span aria-hidden className='size-6 shrink-0 border border-theme-muted/40' style={{ backgroundColor: swatch }} />
        <span className='min-w-0 flex-1 text-sm'>{label}</span>
        <input
            type='radio'
            value={value}
            {...input}
            className='peer sr-only'
        />
    </label>
);

interface AppearanceSectionProps {
    fallbackTheme: ThemeColor;
    wallpaperUrl: string | null;
    input: UseFormRegisterReturn<'theme'>;
}

const AppearanceSection = ({ fallbackTheme, wallpaperUrl, input }: AppearanceSectionProps) => {
    const { t } = useTranslation();
    const [result, setResult] = useState<{ source: string; palette: ImagePalette | null } | null>(null);

    useEffect(() => {
        if (!wallpaperUrl) return;

        let active = true;
        void extractImagePalette(wallpaperUrl).then((palette) => {
            if (active) setResult({ source: wallpaperUrl, palette });
        });
        return () => { active = false; };
    }, [wallpaperUrl]);

    const palette = result?.source === wallpaperUrl ? result?.palette : null;
    const autoSwatch = palette
        ? `oklch(0.76 ${0.13 * palette.saturation} ${palette.hue})`
        : themeSwatches[fallbackTheme];

    return (
        <section className='flex min-w-0 flex-col gap-3'>
            <div className='flex items-center justify-between gap-4 border-b border-theme-border/20 pb-3'>
                <ScrambleText
                    as='h2'
                    className='text-xs uppercase tracking-[0.2em] text-theme-muted'
                    text={t('settings.themes')}
                />
            </div>

            <div className='grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3'>
                {wallpaperUrl && (
                    <ThemeChoice
                        value='auto'
                        label={t('settings.theme.auto')}
                        swatch={autoSwatch}
                        input={input}
                    />
                )}

                {themeColors.map((color) => (
                    <ThemeChoice
                        key={color}
                        value={color}
                        label={t(`settings.theme.${color}`)}
                        swatch={themeSwatches[color]}
                        input={input}
                    />
                ))}
            </div>
        </section>
    );
};

interface AnimationsSectionProps {
    duration: UserPreferences['transitionDuration'];
    onChange: (duration: UserPreferences['transitionDuration']) => void;
}

const AnimationsSection = ({ duration, onChange }: AnimationsSectionProps) => {
    const { t } = useTranslation();

    return (
        <section className='flex flex-col gap-3'>
            <div className='flex items-center justify-between gap-4 border-b border-theme-border/20 pb-3'>
                <ScrambleText
                    as='h2'
                    className='text-xs uppercase tracking-[0.2em] text-theme-muted'
                    text={t('settings.animations')}
                />
            </div>
            <div className='flex flex-col gap-2'>
                {transitionSpeeds.map((speed, index) => (
                    <label key={speed} className='flex min-h-14 cursor-pointer items-center justify-between gap-3 border border-theme-border/20 bg-theme-surface/40 p-4 hover:border-theme-border/50 has-checked:border-theme-accent has-checked:bg-theme-border/10'>
                        <span className='text-xs font-bold uppercase tracking-widest text-theme-text'>{t(`settings.speed.${(['slow', 'normal', 'fast'] as const)[index]}`)}</span>
                        <span className='text-xs tabular-nums text-theme-muted'>{t('common.seconds', { value: speed })}</span>

                        <input
                            type='radio'
                            name='transition-duration'
                            value={speed}
                            checked={duration === speed}
                            onChange={() => onChange(speed)}
                            className='peer sr-only'
                        />
                    </label>
                ))}
            </div>
        </section>
    );
};

const AppearancePage = () => {
    const { t } = useTranslation();
    const { user, getUser } = useAuth();
    const { register, control, handleSubmit, reset, formState: { isDirty, isSubmitting, defaultValues: savedValues } } = useForm<AppearanceValues>({
        defaultValues: getAppearanceValues(user!.preferences)
    });
    const [theme, transitionDuration] = useWatch({ control, name: ['theme', 'transitionDuration'] });
    const wallpaperUrl = getWallpaperUrl(user!.preferences.homeWallpaper);
    const isDefault = theme === defaultValues.theme && transitionDuration === defaultValues.transitionDuration;
    const hasSavedChanges = savedValues?.theme !== defaultValues.theme
        || savedValues?.transitionDuration !== defaultValues.transitionDuration;

    useThemePreview({
        themeColor: theme === 'auto' ? user!.preferences.themeColor : theme,
        themeFromWallpaper: !!wallpaperUrl && theme === 'auto'
    });

    const saveAppearance = async (values: AppearanceValues) => {
        try {
            const { data } = await UserAPI.updatePreferences({
                themeColor: values.theme === 'auto' ? user!.preferences.themeColor : values.theme,
                themeFromWallpaper: !!wallpaperUrl && values.theme === 'auto',
                transitionDuration: values.transitionDuration
            });
            if (getUser()?.id === user!.id) reset(getAppearanceValues(data));
        } catch (failure) {
            console.error('Failed to save appearance', failure);
        }
    };

    return (
        <div className='flex flex-col gap-6'>
            <h1 className='text-xl font-bold tracking-tight'>{t('settings.appearance')}</h1>
            <SettingsForm isPending={isSubmitting} onSubmit={handleSubmit(saveAppearance)}>
                <AppearanceSection
                    fallbackTheme={user!.preferences.themeColor}
                    wallpaperUrl={wallpaperUrl}
                    input={register('theme')}
                />

                <Controller
                    control={control}
                    name='transitionDuration'
                    render={({ field }) => <AnimationsSection duration={field.value} onChange={field.onChange} />}
                />

                <FormActionsSection
                    isPending={isSubmitting}
                    isDirty={isDirty}
                    onCancel={() => reset()}
                    canRestoreDefaults={hasSavedChanges && !isDefault}
                    onRestoreDefaults={() => reset(defaultValues, { keepDefaultValues: true })}
                />
            </SettingsForm>
        </div>
    );
};

export default AppearancePage;

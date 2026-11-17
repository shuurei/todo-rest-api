import { useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { translateError } from '@/i18n';
import LanguageSelect from '@/components/common/LanguageSelect';
import {
    defaultUserPreferences,
    transitionSpeeds,
    themeColors,
    type ThemeColor,
    type UserPreferences
} from '@todo/shared';
import { UserAPI } from '@/api/UserAPI';
import Button from '@/components/common/Button';
import Checkbox from '@/components/common/Checkbox';
import { useThemePreview } from '@/contexts/ThemeContext';
import ScrambleText from '@/components/ScrambleText';
import { useAuth } from '@/contexts/AuthContext';
import type { User } from '@/types/user';

const themes: Record<ThemeColor, string> = {
    green: '#8bc66a',
    blue: '#6aacc6',
    purple: '#ad8bdb',
    amber: '#d9ad59',
    white: '#ffffff',
    black: '#000000'
};

type PreferenceCategory = 'appearance' | 'language';

function PreferencesForm({ user, category }: { user: User; category: PreferenceCategory }) {
    const { t } = useTranslation();
    const { getUser } = useAuth();
    const [preferences, setPreferences] = useState<UserPreferences>({
        ...user.preferences
    });
    const [isPending, setIsPending] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [saved, setSaved] = useState(false);
    const isDirty =
        category === 'language'
            ? preferences.language !== user.preferences.language
            : preferences.themeColor !== user.preferences.themeColor ||
              preferences.transitionDuration !== user.preferences.transitionDuration ||
              preferences.themeFromWallpaper !== user.preferences.themeFromWallpaper;

    useThemePreview(
        category === 'appearance'
            ? {
                  themeColor: preferences.themeColor,
                  themeFromWallpaper: preferences.themeFromWallpaper
              }
            : null
    );

    function changePreferences(update: Partial<UserPreferences>) {
        setPreferences((current) => ({
            ...current,
            ...update
        }));

        setSaved(false);

        setError(null);
    }

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        if (isPending || !isDirty) {
            return;
        }

        setIsPending(true);

        setError(null);

        setSaved(false);

        try {
            const payload =
                category === 'language'
                    ? {
                          language: preferences.language
                      }
                    : {
                          themeColor: preferences.themeColor,
                          transitionDuration: preferences.transitionDuration,
                          themeFromWallpaper: preferences.themeFromWallpaper
                      };
            const { data } = await UserAPI.updatePreferences(payload);
            const currentUser = getUser();

            if (currentUser?.id !== user.id) {
                return;
            }

            setPreferences(data);

            setSaved(true);
        } catch (failure) {
            setError(
                (
                    failure as {
                        code?: string;
                    }
                ).code ?? 'SERVER_ERROR'
            );
        } finally {
            setIsPending(false);
        }
    }

    return (
        <form onSubmit={handleSubmit} aria-busy={isPending} className="flex flex-col gap-6">
            <fieldset disabled={isPending} className="flex min-w-0 flex-col gap-8 disabled:opacity-60">
                {category === 'language' && (
                    <div className="flex flex-col gap-3 border border-theme-border/20 bg-theme-surface/50 p-4">
                        <LanguageSelect
                            value={preferences.language}
                            onChange={(language) =>
                                changePreferences({
                                    language
                                })
                            }
                        />
                        <p className="text-xs text-theme-dim">{t('settings.languageHelp')}</p>
                    </div>
                )}
                {category === 'appearance' && (
                    <>
                        <p className="text-xs leading-relaxed text-theme-dim">{t('settings.themePreview')}</p>
                        <div className="flex flex-col gap-3 border border-theme-border/20 p-4">
                            <Checkbox
                                className="min-h-11 w-full"
                                label={t('homeSettings.dynamicTheme')}
                                checked={preferences.themeFromWallpaper}
                                disabled={!user.preferences.homeWallpaper}
                                onChange={(event) =>
                                    changePreferences({
                                        themeFromWallpaper: event.target.checked
                                    })
                                }
                            />
                            <p className="text-xs leading-relaxed text-theme-dim">{t('homeSettings.dynamicHelp')}</p>
                        </div>
                        <fieldset className="min-w-0">
                            <legend className="mb-3 w-full border-b border-theme-border/20 pb-3">
                                <span className="flex items-center justify-between gap-4">
                                    <span className="text-xs uppercase tracking-[0.2em] text-theme-muted">
                                        <ScrambleText text={t('settings.appearance')} />
                                    </span>
                                    <span className="text-[10px] text-theme-dim">
                                        {t('settings.themes', {
                                            count: themeColors.length
                                        })}
                                    </span>
                                </span>
                            </legend>
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                {themeColors.map((color) => (
                                    <label
                                        key={color}
                                        className="group flex cursor-pointer items-center gap-4 border border-theme-border/20 bg-theme-surface/40 p-4 transition-colors hover:border-theme-border/50 has-checked:border-theme-accent has-checked:bg-theme-border/10 has-focus-visible:ring-2 has-focus-visible:ring-theme-accent has-disabled:cursor-not-allowed"
                                    >
                                        <input
                                            type="radio"
                                            name="themeColor"
                                            value={color}
                                            checked={preferences.themeColor === color}
                                            onChange={() =>
                                                changePreferences({
                                                    themeColor: color,
                                                    themeFromWallpaper: false
                                                })
                                            }
                                            className="peer sr-only"
                                        />
                                        <span
                                            aria-hidden
                                            className="size-6 shrink-0 border border-theme-muted/40"
                                            style={{
                                                backgroundColor: themes[color]
                                            }}
                                        />
                                        <span className="min-w-0 flex-1 text-sm">{t(`settings.theme.${color}`)}</span>
                                        <span
                                            aria-hidden
                                            className="size-2 shrink-0 border border-theme-border/40 peer-checked:border-theme-accent peer-checked:bg-theme-accent"
                                        />
                                    </label>
                                ))}
                            </div>
                        </fieldset>

                        <div className="flex flex-col gap-3">
                            <div className="flex items-center justify-between gap-4 border-b border-theme-border/20 pb-3">
                                <h2 className="text-xs uppercase tracking-[0.2em] text-theme-muted">
                                    <ScrambleText text={t('settings.animations')} />
                                </h2>
                                <span className="text-[10px] text-theme-dim">{t('settings.miniApps')}</span>
                            </div>
                            <div className="flex flex-col gap-4 border border-theme-border/20 bg-theme-surface/50 p-4">
                                <fieldset className="flex flex-col gap-3">
                                    <legend className="mb-1 text-xs font-bold uppercase tracking-widest text-theme-highlight">
                                        {t('settings.transitionDuration')}
                                    </legend>
                                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                                        {transitionSpeeds.map((duration, index) => {
                                            const speed = (['fast', 'normal', 'slow'] as const)[index];
                                            console.log(duration)
                                            return (
                                                <label
                                                    key={duration}
                                                    className="flex min-h-14 cursor-pointer items-center justify-between gap-3 border border-theme-border/20 bg-theme-surface/40 p-4 transition-colors hover:border-theme-border/50 has-checked:border-theme-accent has-checked:bg-theme-border/10 has-focus-visible:ring-2 has-focus-visible:ring-theme-accent"
                                                >
                                                    <input
                                                        type="radio"
                                                        name="transition-duration"
                                                        value={duration}
                                                        checked={preferences.transitionDuration === duration}
                                                        onChange={() =>
                                                            changePreferences({
                                                                transitionDuration: duration
                                                            })
                                                        }
                                                        className="peer sr-only"
                                                    />
                                                    <span className="text-xs font-bold uppercase tracking-widest text-theme-text">
                                                        {t(`settings.speed.${speed}`)}
                                                    </span>
                                                    <span className="text-xs tabular-nums text-theme-muted">
                                                        {t('common.seconds', {
                                                            value: duration
                                                        })}
                                                    </span>
                                                    <span
                                                        aria-hidden
                                                        className="size-2 shrink-0 border border-theme-border/40 peer-checked:border-theme-accent peer-checked:bg-theme-accent"
                                                    />
                                                </label>
                                            );
                                        })}
                                    </div>
                                </fieldset>
                                <p className="text-xs text-theme-dim">{t('settings.transitionsHelp')}</p>
                            </div>
                        </div>
                    </>
                )}

                <div className="flex flex-col gap-4 border border-theme-border/20 bg-theme-surface/50 p-4">
                    <p className="text-[10px] uppercase tracking-widest text-theme-dim">
                        {t(isDirty ? 'settings.unsaved' : 'settings.synced')}
                    </p>
                    <div className="flex flex-wrap gap-3">
                        <Button
                            type="submit"
                            disabled={!isDirty}
                            className="w-auto border border-theme-accent bg-theme-accent text-theme-surface hover:bg-transparent hover:text-theme-highlight focus-visible:ring-theme-accent"
                        >
                            <ScrambleText text={t(isPending ? 'common.saving' : 'settings.save')} />
                        </Button>
                        {category === 'appearance' && (
                            <Button
                                type="button"
                                disabled={!isDirty}
                                onClick={() =>
                                    changePreferences({
                                        ...user.preferences
                                    })
                                }
                                className="w-auto border border-theme-border/30 bg-transparent text-theme-muted hover:border-theme-accent focus-visible:ring-theme-accent"
                            >
                                {t('common.cancel')}
                            </Button>
                        )}
                        <Button
                            type="button"
                            onClick={() =>
                                changePreferences({
                                    ...defaultUserPreferences
                                })
                            }
                            className="w-auto border border-theme-border/30 bg-transparent text-theme-muted hover:border-theme-accent focus-visible:ring-theme-accent"
                        >
                            {t('settings.restoreDefaults')}
                        </Button>
                    </div>
                </div>
            </fieldset>
            {error && (
                <p role="alert" className="border border-red-400/30 p-4 text-xs text-red-400">
                    {translateError(error)}
                </p>
            )}
            {saved && (
                <p role="status" className="border border-theme-border/30 p-4 text-xs text-theme-highlight">
                    {t('settings.saved')}
                </p>
            )}
        </form>
    );
}

export default function PreferencesPage({ category }: { category: PreferenceCategory }) {
    const { t } = useTranslation();
    const { user } = useAuth();

    return (
        <div className="flex flex-col gap-6">
            <h1 className="text-xl font-bold tracking-tight">
                {t(category === 'appearance' ? 'settings.appearance' : 'common.language')}
            </h1>
            {user && <PreferencesForm key={`${user.id}-${category}`} user={user} category={category} />}
        </div>
    );
}

import { useTranslation } from 'react-i18next'
import { defaultUserPreferences, type UserPreferences } from '@todo/shared'
import { UserAPI } from '@/api/UserAPI'
import { useAuth } from '@/contexts/AuthContext'
import LanguageSelect from '@/components/common/LanguageSelect'
import SettingsForm from '@/components/settings/SettingsForm'
import FormActionsSection from '@/components/settings/FormActionsSection'
import { Controller, useForm, useWatch } from 'react-hook-form'

interface LanguageSectionProps {
    language: UserPreferences['language'];
    onChange: (language: UserPreferences['language']) => void;
}

const LanguageSection = ({ language, onChange }: LanguageSectionProps) => {
    return (
        <section className='flex flex-col gap-3 border border-theme-border/20 bg-theme-surface/50 p-4'>
            <LanguageSelect value={language} onChange={onChange} />
        </section>
    );
};

const LanguagePage = () => {
    const { t } = useTranslation();
    const { user, getUser } = useAuth();
    const { control, handleSubmit, reset, formState: { isDirty, isSubmitting, defaultValues } } = useForm<Pick<UserPreferences, 'language'>>({
        defaultValues: { language: user!.preferences.language }
    });
    const language = useWatch({ control, name: 'language' });
    const canRestoreDefaults = defaultValues?.language !== defaultUserPreferences.language
        && language !== defaultUserPreferences.language;

    const saveLanguage = async (values: Pick<UserPreferences, 'language'>) => {
        try {
            const { data } = await UserAPI.updatePreferences(values);
            if (getUser()?.id === user!.id) reset({ language: data.language });
        } catch (failure) {
            console.error('Failed to save language', failure);
        }
    };

    return (
        <div className='flex flex-col gap-6'>
            <h1 className='text-xl font-bold tracking-tight'>{t('common.language')}</h1>

            <SettingsForm isPending={isSubmitting} onSubmit={handleSubmit(saveLanguage)}>
                <Controller
                    control={control}
                    name='language'
                    render={({ field }) => <LanguageSection language={field.value} onChange={field.onChange} />}
                />

                <FormActionsSection
                    isPending={isSubmitting}
                    isDirty={isDirty}
                    onCancel={() => reset()}
                    canRestoreDefaults={canRestoreDefaults}
                    onRestoreDefaults={() => reset({ language: defaultUserPreferences.language }, { keepDefaultValues: true })}
                />
            </SettingsForm>
        </div>
    );
};

export default LanguagePage;

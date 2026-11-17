import { useTranslation } from 'react-i18next';
import Button from '@/components/common/Button';

interface FormActionsSectionProps {
    isPending: boolean;
    isDirty: boolean;
    canSave?: boolean;
    canRestoreDefaults?: boolean;
    onCancel: () => void;
    onRestoreDefaults?: () => void;
}

const FormActionsSection = ({ isPending, isDirty, canSave = isDirty, canRestoreDefaults = false, onCancel, onRestoreDefaults }: FormActionsSectionProps) => {
    const { t } = useTranslation();

    return (
        <div className="flex flex-wrap gap-3">
            <Button type="submit" disabled={isPending || !canSave} className="min-h-12 w-auto border border-theme-accent bg-theme-accent text-theme-surface">
                {t(isPending ? 'common.saving' : 'common.saveChanges')}
            </Button>
            {isDirty && (
                <Button type="button" disabled={isPending} onClick={onCancel} className="min-h-12 w-auto border border-theme-border/30 text-theme-muted">
                    {t('common.cancel')}
                </Button>
            )}
            {canRestoreDefaults && onRestoreDefaults && (
                <Button type="button" disabled={isPending} onClick={onRestoreDefaults} className="min-h-12 w-auto border border-theme-border/30 text-theme-muted">
                    {t('settings.restoreDefaults')}
                </Button>
            )}
        </div>
    );
};

export default FormActionsSection;

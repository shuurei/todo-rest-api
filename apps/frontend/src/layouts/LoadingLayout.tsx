import { useTranslation } from 'react-i18next'

export default function LoadingLayout() {
    const { t } = useTranslation();
    return (
        <div>
            <p>{t('common.loading')}</p>
        </div>
    );
}
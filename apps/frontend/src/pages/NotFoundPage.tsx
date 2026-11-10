import { useNavigate } from 'react-router'
import { useTranslation } from 'react-i18next'
import MessageDialog from '@/components/MessageDialog'
import { useAuth } from '@/contexts/AuthContext'
import { useMiniApp } from '@/contexts/MiniAppContext'

export default function NotFoundPage() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { clearMiniApp } = useMiniApp();

    return <MessageDialog
        title={t('dialogs.notFoundTitle')}
        message={t('dialogs.notFoundMessage')}
        action={t(user ? 'common.backHome' : 'common.login')}
        onClose={() => {
            clearMiniApp();
            navigate(user ? '/' : '/auth/login', { replace: true });
        }}
    />;
}

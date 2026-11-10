import { AnimatePresence } from 'motion/react'
import { useTranslation } from 'react-i18next'
import { setGuestLanguage, translateError } from '@/i18n'
import LanguageSelect from '@/components/common/LanguageSelect'
import { Link, useLocation } from 'react-router'

import PasswordInput from '@/components/common/PasswordInput'
import ProgressBar from '@/components/common/ProgresBar'
import Button from '@/components/common/Button'
import TextInput from '@/components/common/TextInput'
import ScrambleText from '@/components/ScrambleText'
import { Modal } from '@/components/Modal'
import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { AuthAPI } from '@/api/AuthAPI'

export default function AuthPage() {
    const { t, i18n } = useTranslation();
    const { pathname } = useLocation();
    const type = pathname.endsWith('/register') ? 'register' : 'login';

    const [formData, setFormData] = useState({
        username: '',
        password: ''
    });

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const isLogin = type === 'login'

    const { setUser } = useAuth();

    useEffect(() => {
        setFormData({
            username: '',
            password: ''
        });

        setError(null);
    }, [type]);

    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = event.target;

        setFormData((prev) => ({
            ...prev,
            [name]: value
        }));

        setError(null);
    }

    const handleSubmit = async (event: React.SubmitEvent<HTMLFormElement>) => {
        event.preventDefault()

        setIsLoading(true);
        setError(null);

        try {
            const { data } = await AuthAPI[isLogin ? 'login' : 'register']({
                username: formData.username,
                password: formData.password
            });

            await new Promise((resolve) => setTimeout(resolve, 3000));

            setUser(data.user);
        } catch (err: any) {
            setError(err.code ?? err.errors?.username ?? 'SERVER_ERROR');

            if (isLogin) {
                setFormData((prev) => ({
                    ...prev,
                    password: ''
                }));
            }

            await new Promise((resolve) => setTimeout(resolve, 3000));

            setIsLoading(false);
        }
    }

    return (
        <main className='flex items-center justify-center h-full w-full'>
            <Modal
                key={`${type}.${isLoading}`}
                className='h-full w-full sm:max-w-md flex flex-col sm:h-fit'
            >
                <Modal.Header className='items-center justify-between'>
                    <span className='text-[10px] uppercase tracking-[0.2em] text-theme-muted'>
                        <ScrambleText
                            text={t(isLogin ? 'auth.loginProtocol' : 'auth.registerProtocol')}
                            duration={850}
                        />
                    </span>

                    <span className='flex items-center gap-2 text-[9px] uppercase tracking-widest text-theme-accent'>
                        <ScrambleText
                            text={t(isLoading ? 'common.loading' : 'auth.online')}
                            duration={1250}
                        />
                        <span className='h-1.5 w-1.5 animate-blink bg-theme-accent' />
                        <span>//</span>
                    </span>
                </Modal.Header>

                <Modal.Content className='flex flex-col flex-1 justify-center'>
                    <AnimatePresence mode='wait' initial={false} >
                        {isLoading ? (
                            <ProgressBar infinite duration={225} />
                        ) : (<>
                            <form onSubmit={handleSubmit} className='space-y-5'>
                                <TextInput
                                    className='uppercase'
                                    label={t('common.username')}
                                    id='username'
                                    name='username'
                                    placeholder={t('auth.usernamePlaceholder')}
                                    autoComplete='username webauthn'
                                    value={formData.username}
                                    onChange={handleChange}
                                    required
                                    error={error ? translateError(error) : null}
                                    showLabelError={false}
                                />

                                <PasswordInput
                                    label={t('common.password')}
                                    id='password'
                                    name='password'
                                    placeholder='********'
                                    autoComplete={isLogin ? 'current-password webauthn' : 'new-password webauthn'}
                                    value={formData.password}
                                    onChange={handleChange}
                                    minLength={import.meta.env.DEV ? 0 : 8}
                                    required
                                    error={error ? translateError(error) : null}
                                />

                                <Button
                                    type='submit'
                                    className='mt-3 h-12 border border-theme-highlight/50 bg-theme-border/15 text-xs uppercase tracking-[0.2em] text-theme-text shadow-none hover:border-theme-highlight hover:bg-theme-border/30'
                                >
                                    <ScrambleText
                                        text={t(isLogin ? 'auth.initializeSession' : 'auth.createIdentity')}
                                        duration={5000}
                                    />
                                </Button>
                            </form>

                            <div className='my-6 flex items-center gap-3'>
                                <div className='h-px flex-1 bg-theme-border/30' />

                                <span className='text-[9px] uppercase tracking-[0.2em] text-theme-dim'>
                                    {t('common.or')}
                                </span>

                                <div className='h-px flex-1 bg-theme-border/30' />
                            </div>

                            <p className='flex flex-col gap-1 text-center text-xs text-theme-muted'>
                                <ScrambleText
                                    text={t(isLogin ? 'auth.noIdentity' : 'auth.alreadyRegistered')}
                                    duration={400}
                                />

                                <Link to={isLogin ? '/auth/register' : '/auth/login'} className='font-bold text-theme-highlight transition hover:text-white'>
                                    {t(isLogin ? 'auth.registerLink' : 'auth.loginLink')}
                                </Link>
                            </p>
                        </>)}
                    </AnimatePresence>
                </Modal.Content>

                {!isLoading && (
                    <Modal.Footer className='flex-col gap-4'>
                        <LanguageSelect value={i18n.resolvedLanguage === 'en' ? 'en' : 'fr'} onChange={setGuestLanguage} />
                        <ScrambleText text={t('auth.systemVersion')} duration={1500} />
                    </Modal.Footer>
                )}
            </Modal>
        </main>
    );
}

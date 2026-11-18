import { useActionState, useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router'
import { AnimatePresence } from 'motion/react'
import { useTranslation } from 'react-i18next'

import { setGuestLanguage, translateError } from '@/i18n'
import LanguageSelect from '@/components/common/LanguageSelect'
import PasswordInput from '@/components/common/PasswordInput'
import ProgressBar from '@/components/common/ProgresBar'
import Button from '@/components/common/Button'
import TextInput from '@/components/common/TextInput'
import ScrambleText from '@/components/ScrambleText'
import { Modal } from '@/components/Modal'
import { getApiErrorCode } from '@/utils/api-error'
import { AuthAPI } from '@/api/AuthAPI'
import { useGateway } from '@/hooks/useGateway'

interface AuthFormState {
    username: string;
    password: string;
    error: string | null;
}

export default function AuthPage() {
    const { pathname } = useLocation();
    const { t, i18n } = useTranslation();
    const { status, unavailable, transition, retryAt, closeCode } = useGateway();
    const [now, setNow] = useState(Date.now);

    useEffect(() => {
        if (retryAt === null) return;

        const timer = setInterval(() => setNow(Date.now()), 100);
        return () => clearInterval(timer);
    }, [retryAt]);

    const retrySeconds = retryAt === null ? 0 : Math.max(0, Math.ceil((retryAt - now) / 1000));

    const type = pathname.endsWith('/register') ? 'register' : 'login';
    const isLogin = type === 'login';

    const [state, submitAction, isLoading] = useActionState<AuthFormState, FormData>(async (_previousState, formData) => {
        const username = String(formData.get('username') ?? '');
        const password = String(formData.get('password') ?? '');

        try {
            await AuthAPI[type]({ username, password });

            return {
                username: '',
                password: '',
                error: null
            };
        } catch (failure) {
            return {
                username,
                password: isLogin ? '' : password,
                error: getApiErrorCode(failure)
            };
        }
    }, {
        username: '',
        password: '',
        error: null
    });

    const { error } = state;
    const showProgress = isLoading || (status === 'connecting' && !unavailable);

    return (
        <main className='flex items-center justify-center h-full w-full'>
            <Modal key={`${type}.${showProgress}`} className='h-full w-full sm:max-w-lg flex flex-col sm:h-fit'>
                <Modal.Header className='items-center justify-between'>
                    <span className='text-2xs uppercase tracking-[0.2em] text-theme-muted'>
                        <ScrambleText
                            text={t(unavailable ? 'auth.reconnectProtocol' : transition === 'logout' ? 'auth.logoutProtocol' : isLogin ? 'auth.loginProtocol' : 'auth.registerProtocol')}
                            duration={850}
                        />
                    </span>

                    <span className='flex text-2xs items-center gap-2 uppercase tracking-widest text-theme-accent'>
                        <ScrambleText
                            text={t(unavailable ? 'auth.offline' : showProgress ? 'common.loading' : 'auth.online')}
                            duration={1250}
                        />
                        <span className='h-1.5 w-1.5 animate-blink bg-theme-accent' />
                        <span>//</span>
                    </span>
                </Modal.Header>

                <Modal.Content className='flex flex-col flex-1 justify-center'>
                    <AnimatePresence mode='wait' initial={false}>
                        {showProgress ? (
                            <ProgressBar infinite duration={225} />
                        ) : unavailable ? (
                            <div className='space-y-5 text-center' role='status' aria-live='polite'>
                                <p className='text-sm text-theme-text'>{t('connection.unavailable')}</p>
                                <p className='text-xs text-theme-muted'>{t('connection.description')}</p>
                                {status === 'connecting' ? (
                                    <ProgressBar infinite duration={225} label={t('connection.connecting')} />
                                ) : status === 'fatal' ? (
                                    <>
                                        <p className='text-xs text-theme-muted'>
                                            {t('connection.fatal', { code: closeCode })}
                                        </p>
                                        <Button type='button' onClick={() => window.location.reload()}>
                                            {t('connection.reload')}
                                        </Button>
                                    </>
                                ) : retryAt !== null ? (
                                    <p className='text-xs text-theme-accent'>
                                        {t('connection.retryIn', { count: retrySeconds })}
                                    </p>
                                ) : null}
                            </div>
                        ) : (
                            <>
                                <form action={submitAction} className='space-y-5'>
                                    <TextInput
                                        label={t('common.username')}
                                        id='username'
                                        name='username'
                                        placeholder={t('auth.usernamePlaceholder')}
                                        autoComplete='username webauthn'
                                        defaultValue={state.username}
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
                                        defaultValue={state.password}
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

                                    <span className='text-xs uppercase tracking-[0.2em] text-theme-dim'>
                                        {t('common.or')}
                                    </span>

                                    <div className='h-px flex-1 bg-theme-border/30' />
                                </div>

                                <p className='flex flex-col gap-1 text-center text-xs text-theme-muted'>
                                    <ScrambleText
                                        text={t(isLogin ? 'auth.noIdentity' : 'auth.alreadyRegistered')}
                                        duration={400}
                                    />

                                    <Link
                                        to={isLogin ? '/auth/register' : '/auth/login'}
                                        className="font-bold text-theme-highlight transition hover:text-white"
                                    >
                                        {t(isLogin ? 'auth.registerLink' : 'auth.loginLink')}
                                    </Link>
                                </p>
                            </>
                        )}
                    </AnimatePresence>
                </Modal.Content>

                {(!showProgress || unavailable) && (
                    <Modal.Footer className='flex-col gap-4'>
                        <LanguageSelect
                            value={i18n.resolvedLanguage === 'en' ? 'en' : 'fr'}
                            onChange={setGuestLanguage}
                        />
                    </Modal.Footer>
                )}
            </Modal>
        </main>

    )
}
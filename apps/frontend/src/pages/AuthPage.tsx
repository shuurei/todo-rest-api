import { AnimatePresence } from 'motion/react'
import { Link, Navigate, useParams } from 'react-router'

import PasswordInput from '@/components/common/PasswordInput'
import ProgressBar from '@/components/common/ProgresBar'
import Button from '@/components/common/Button'
import TextInput from '@/components/common/TextInput'
import ScrambleText from '@/components/ScrambleText'
import { Modal } from '@/components/Modal'
import { useEffect, useState } from 'react'
import { useAuthStore } from '@/stores/useAuthStore'
import { AuthAPI } from '@/api/AuthAPI'

export default function AuthPage() {
    const { type } = useParams<{ type: 'login' | 'register' }>();

    if (type !== 'login' && type !== 'register') {
        return <Navigate to="/auth/login" replace />
    }

    const [formData, setFormData] = useState({
        username: '',
        password: ''
    });

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const isLogin = type === 'login'

    const setUser = useAuthStore((state) => state.setUser);
    const setToken = useAuthStore((state) => state.setToken);

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
            setToken(data.token);
        } catch (err: any) {
            setError(err.code ?? err.errors.username);

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
                    <span className='text-[10px] uppercase tracking-[0.2em] text-[#82aa6b]'>
                        <ScrambleText
                            text={isLogin ? 'Login protocol' : 'Registration protocol'}
                            duration={850}
                        />
                    </span>

                    <span className='flex items-center gap-2 text-[9px] uppercase tracking-widest text-[#8bc66a]'>
                        <ScrambleText
                            text={isLoading ? 'Loading..' : 'System online'}
                            duration={1250}
                        />
                        <span className='h-1.5 w-1.5 animate-blink bg-[#8bc66a]' />
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
                                    label='Username'
                                    id='username'
                                    name='username'
                                    placeholder='username'
                                    autoComplete='username webauthn'
                                    value={formData.username}
                                    onChange={handleChange}
                                    required
                                    error={error}
                                    showLabelError={false}
                                />

                                <PasswordInput
                                    label='Password'
                                    id='password'
                                    name='password'
                                    placeholder='********'
                                    autoComplete={isLogin ? 'current-password webauthn' : 'new-password webauthn'}
                                    value={formData.password}
                                    onChange={handleChange}
                                    minLength={import.meta.env.DEV ? 0 : 8}
                                    required
                                    error={error}
                                />

                                <Button
                                    type='submit'
                                    className='mt-3 h-12 border border-[#a8d887]/50 bg-[#5b9c3b]/15 text-xs uppercase tracking-[0.2em] text-[#c5e6ad] shadow-none hover:border-[#a8d887] hover:bg-[#5b9c3b]/30'
                                >
                                    <ScrambleText
                                        text={isLogin ? 'Initialize session' : 'Create identity'}
                                        duration={5000}
                                    />
                                </Button>
                            </form>

                            <div className='my-6 flex items-center gap-3'>
                                <div className='h-px flex-1 bg-[#5b9c3b]/30' />

                                <span className='text-[9px] uppercase tracking-[0.2em] text-[#527a43]'>
                                    Or
                                </span>

                                <div className='h-px flex-1 bg-[#5b9c3b]/30' />
                            </div>

                            <p className='flex flex-col gap-1 text-center text-xs text-[#77966a]'>
                                <ScrambleText
                                    text={isLogin ? 'No existing identity ? ' : 'Already registered ? '}
                                    duration={400}
                                />

                                <Link to={isLogin ? '/auth/register' : '/auth/login'} className='font-bold text-[#a8d887] transition hover:text-white'>
                                    {isLogin ? '[REGISTER]' : '[LOGIN]'}
                                </Link>
                            </p>
                        </>)}
                    </AnimatePresence>
                </Modal.Content>

                {!isLoading && (
                    <Modal.Footer>
                        <ScrambleText text='// System v.26' duration={1500} />
                    </Modal.Footer>
                )}
            </Modal>
        </main>
    );
}

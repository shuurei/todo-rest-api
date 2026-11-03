import { AnimatePresence, motion } from 'motion/react'
import { Link, Navigate, useParams } from 'react-router'

import Button from '@/components/common/Button'
import TextInput from '@/components/common/TextInput'
import PasswordInput from '@/components/common/PasswordInput'
import ScrambleText from '@/components/ScrambleText'
import { Modal } from '@/components/Modal'

export default function AuthPage() {
    const { type } = useParams<{ type: 'login' | 'register' }>();

    if (type !== 'login' && type !== 'register') {
        return <Navigate to="/auth/login" replace />
    }

    const isLogin = type === 'login'

    const handleSubmit = (event: React.SubmitEvent) => {
        event.preventDefault();
    }

    return (
        <main className='flex items-center justify-center h-full w-full'>
            <Modal className='w-full max-w-md'>
                <Modal.Header className='items-center justify-between'>
                    <span className='text-[10px] uppercase tracking-[0.2em] text-[#82aa6b]'>
                        <ScrambleText
                            text={isLogin ? 'Login protocol' : 'Registration protocol'}
                            duration={850}
                        />
                    </span>

                    <span className='flex items-center gap-2 text-[9px] uppercase tracking-widest text-[#8bc66a]'>
                        <ScrambleText
                            text="System online"
                            duration={1250}
                        />
                        <span className="h-1.5 w-1.5 animate-blink bg-[#8bc66a]" />
                                //
                    </span>
                </Modal.Header>

                <Modal.Content>
                    <AnimatePresence mode='wait' initial={false}>
                        <form onSubmit={handleSubmit} className='space-y-5' >
                            {!isLogin && (
                                <TextInput
                                    className='uppercase'
                                    label='Username'
                                    id='username'
                                    name='username'
                                    placeholder='username'
                                    autoComplete='username webauthn'
                                    required
                                />
                            )}

                            <TextInput
                                className='uppercase'
                                label='E-mail'
                                id='email'
                                name='email'
                                type='email'
                                placeholder='user@example.com'
                                autoComplete='home email webauthn'
                                required
                            />

                            <PasswordInput
                                label='Password'
                                id='password'
                                name='password'
                                placeholder='********'
                                autoComplete={isLogin ? 'current-password webauthn' : 'new-password webauthn'}
                                minLength={import.meta.env.DEV ? 0 : 8}
                                required
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
                    </AnimatePresence>

                    <div className='my-7 flex items-center gap-3'>
                        <div className='h-px flex-1 bg-[#5b9c3b]/30' />

                        <span className='text-[9px] uppercase tracking-[0.2em] text-[#527a43]'>
                            Or
                        </span>

                        <div className='h-px flex-1 bg-[#5b9c3b]/30' />
                    </div>

                    <p className='text-center text-xs text-[#77966a]'>
                        <ScrambleText
                            text={isLogin ? 'No existing identity ? ' : 'Already registered ? '}
                            duration={400}
                        />

                        <Link
                            to={isLogin ? '/auth/register' : '/auth/login'}
                            className='font-bold text-[#a8d887] transition hover:text-white'
                        >
                            {isLogin ? '[REGISTER]' : '[LOGIN]'}
                        </Link>
                    </p>
                </Modal.Content>

                <Modal.Footer className='flex items-center justify-between'>
                    <ScrambleText text='0x27 © 2026' duration={1500} />
                    <ScrambleText text='System v.26 //' duration={1500} />
                </Modal.Footer>
            </Modal>
        </main>
    );
}

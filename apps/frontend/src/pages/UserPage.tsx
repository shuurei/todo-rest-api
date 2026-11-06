import { useState } from 'react'

import Button from '@/components/common/Button'
import TextInput from '@/components/common/TextInput'
import { useAuthStore } from '@/stores/useAuthStore'
import { useMiniApp } from '@/contexts/MiniAppContext'

export default function SettingsPage() {
    const user = useAuthStore((state) => state.user);
    const logout = useAuthStore((state) => state.logout);

    const [username, setUsername] = useState(user?.username ?? '');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
    const [showLogoutConfirmation, setShowLogoutConfirmation] = useState(false);

    const { clearMiniApp } = useMiniApp();

    const handleDeleteAccount = () => {
        logout()
    }

    const handleLogout = () => {
        clearMiniApp();
        logout()
    }

    return (
        <section className='h-full overflow-y-auto p-6 font-mono text-[#c5e6ad]'>
            <div className='mx-auto flex w-full max-w-3xl flex-col gap-8'>
                <form className='flex max-w-2xl flex-col gap-6'>
                    <div className='flex items-center justify-between border-b border-[#5b9c3b]/20 pb-3'>
                        <h2 className='text-xs uppercase tracking-[0.2em] text-[#82aa6b]'>
                            Account information
                        </h2>
                    </div>

                    <TextInput
                        id='settings-username'
                        label='Username'
                        value={username}
                        onChange={(event) => setUsername(event.target.value)}
                        autoComplete='username'
                        required
                    />

                    <div className='border-t border-[#5b9c3b]/20 pt-6'>
                        <h2 className='mb-5 text-xs uppercase tracking-[0.2em] text-[#82aa6b]'>
                            Change password
                        </h2>

                        <div className='flex flex-col gap-6'>
                            <TextInput
                                id='settings-password'
                                label='New password'
                                type='password'
                                value={password}
                                onChange={(event) => setPassword(event.target.value)}
                                autoComplete='new-password'
                                placeholder='Leave empty to keep current password'
                            />

                            {password && (
                                <TextInput
                                    id='settings-confirm-password'
                                    label='Confirm new password'
                                    type='password'
                                    value={confirmPassword}
                                    onChange={(event) => setConfirmPassword(event.target.value)}
                                    autoComplete='new-password'
                                    required
                                />
                            )}
                        </div>
                    </div>

                    <Button
                        type='submit'
                        className='w-auto self-start border border-[#8bc66a] bg-[#8bc66a] text-[#080e08] hover:bg-transparent hover:text-[#a8d887]'
                    >
                        Save changes
                    </Button>
                </form>

                <div className='max-w-2xl border-t border-red-500/20 pt-6'>
                    <div className='flex items-center justify-between'>
                        <h2 className='text-xs uppercase tracking-[0.2em] text-red-400'>
                            Danger zone
                        </h2>
                    </div>

                    <div className='flex flex-col gap-2'>
                        {!showLogoutConfirmation ? (
                            <Button
                                type='button'
                                onClick={() => setShowLogoutConfirmation(true)}
                                className='mt-5 w-auto border border-red-500/40 bg-transparent text-red-400 hover:border-red-400 hover:bg-red-950/30'
                            >
                                Logout
                            </Button>
                        ) : (
                            <div className='mt-5 flex flex-col gap-4 border border-red-500/30 bg-red-950/10 p-4'>
                                <p className='text-xs text-red-300'>
                                    Are you sure you want to logout ?
                                </p>

                                <div className='flex flex-wrap gap-3'>
                                    <Button
                                        type='button'
                                        onClick={handleLogout}
                                        className='w-auto border border-red-500 bg-red-500 text-[#080e08] hover:bg-transparent hover:text-red-400'
                                    >
                                        Confirm Logout
                                    </Button>

                                    <Button
                                        type='button'
                                        onClick={() => setShowLogoutConfirmation(false)}
                                        className='w-auto border border-[#5b9c3b]/30 bg-transparent text-[#82aa6b] hover:border-[#8bc66a]'
                                    >
                                        Cancel
                                    </Button>
                                </div>
                            </div>
                        )}


                        {!showDeleteConfirmation ? (
                            <Button
                                type='button'
                                onClick={() => setShowDeleteConfirmation(true)}
                                className='mt-5 w-auto border border-red-500/40 bg-transparent text-red-400 hover:border-red-400 hover:bg-red-950/30'
                            >
                                Delete account
                            </Button>
                        ) : (
                            <div className='mt-5 flex flex-col gap-4 border border-red-500/30 bg-red-950/10 p-4'>
                                <p className='text-xs text-red-300'>
                                    Are you sure you want to delete your account ?
                                </p>

                                <div className='flex flex-wrap gap-3'>
                                    <Button
                                        type='button'
                                        onClick={handleDeleteAccount}
                                        className='w-auto border border-red-500 bg-red-500 text-[#080e08] hover:bg-transparent hover:text-red-400'
                                    >
                                        Confirm deletion
                                    </Button>

                                    <Button
                                        type='button'
                                        onClick={() =>
                                            setShowDeleteConfirmation(false)
                                        }
                                        className='w-auto border border-[#5b9c3b]/30 bg-transparent text-[#82aa6b] hover:border-[#8bc66a]'
                                    >
                                        Cancel
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </section>
    );
}
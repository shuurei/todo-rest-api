import { Navigate, Outlet, useLocation, useNavigate } from 'react-router'
import { LuChevronLeft } from 'react-icons/lu'
import { useEffect, useState } from 'react'
import { motion } from 'motion/react'

import { useMiniApp } from '@/contexts/MiniAppContext'
import { Modal } from '@/components/Modal'
import ScrambleText from '@/components/ScrambleText'

import { useAuthStore } from '@/stores/useAuthStore'
import { AuthAPI } from '@/api/AuthAPI' 

export default function AuthLayout() {
    const location = useLocation();
    const navigate = useNavigate();

    const user = useAuthStore((state) => state.user);
    const { apps, miniAppState, openMiniApp, closeMiniApp } = useMiniApp();
    
    const [isExpanded, setIsExpanded] = useState(false);
    const [showContent, setShowContent] = useState(false);

    const isHome = location.pathname === '/';

    useEffect(() => {
        AuthAPI.check();

        if (miniAppState) return;

        const app = apps.find((app) => app.path === location.pathname);
        if (!app) return;

        openMiniApp(app);
    }, []);

    const handleCloseApp = () => {
        navigate('/');
        closeMiniApp();
    }

    if (!user) {
        return <Navigate to='/auth/login' replace />
    }

    return (
        <main className='fixed inset-0 flex items-center justify-center overflow-hidden'>
            <motion.div
                initial={{ width: 100, height: 100 }}
                animate={{
                    width: isExpanded ? '100%' : 100,
                    height: isExpanded ? '100%' : 100
                }}
                transition={{ duration: 0.5, ease: 'easeInOut' }}
                onAnimationComplete={() => setShowContent(isExpanded)}
                className='flex items-center justify-center overflow-hidden'
            >
                <Modal className='h-full w-full' onAnimationComplete={() => setIsExpanded(true)}>
                    {showContent && (
                        <>
                            {!isHome && (
                                <Modal.Header className='items-center justify-between'>
                                    <div className='flex items-center gap-3'>
                                        <button
                                            onClick={handleCloseApp}
                                            className='cursor-pointer flex size-8 items-center justify-center border border-[#5b9c3b]/30 text-[#82aa6b] transition-colors hover:border-[#8bc66a] hover:text-[#c5e6ad]'
                                        >
                                            <LuChevronLeft />
                                        </button>
                                        <span className='text-[10px] uppercase tracking-[0.2em] text-[#82aa6b]'>
                                            <ScrambleText
                                                text={isHome ? user.username : miniAppState?.name ?? '??'}
                                                duration={850}
                                            />
                                        </span>
                                    </div>
                                </Modal.Header>
                            )}

                            <Modal.Content>
                                <Outlet />
                            </Modal.Content>
                        </>
                    )}
                </Modal>
            </motion.div>
        </main>
    );
}
import { Navigate, Outlet, useLocation, useNavigate, useNavigation } from 'react-router'
import { LuChevronLeft } from 'react-icons/lu'
import { useEffect, useState } from 'react'
import { motion } from 'motion/react'

import { useMiniApp } from '@/contexts/MiniAppContext'
import { Modal } from '@/components/Modal'
import ScrambleText from '@/components/ScrambleText'

import { useAuth } from '@/contexts/AuthContext'

export default function AuthLayout() {
    const location = useLocation();
    const navigate = useNavigate();
    const navigation = useNavigation();

    const { user } = useAuth();
    const { apps, miniAppState, openMiniApp, closeMiniApp } = useMiniApp();
    
    const [isExpanded, setIsExpanded] = useState(false);
    const [showContent, setShowContent] = useState(false);

    const isHome = location.pathname === '/';

    useEffect(() => {
        if (miniAppState) return;

        const app = apps.find((app) => app.path === location.pathname);
        if (!app) return;

        openMiniApp(app);
    }, [location.pathname, apps, miniAppState, openMiniApp]);

    const handleCloseApp = () => {
        navigate('/');
        closeMiniApp();
    }

    if (!user) {
        // Let the pending session loader finish (it may need to show expiration).
        if (navigation.state !== 'idle') return null;
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
                                            className='cursor-pointer flex size-8 items-center justify-center border border-theme-border/30 text-theme-muted transition-colors hover:border-theme-accent hover:text-theme-text'
                                        >
                                            <LuChevronLeft />
                                        </button>
                                        <span className='text-[10px] uppercase tracking-[0.2em] text-theme-muted'>
                                            <ScrambleText
                                                text={isHome ? user.username : apps.find(app => app.path === miniAppState?.path)?.name ?? '??'}
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
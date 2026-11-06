import { useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router'
import { AnimatePresence, motion } from 'motion/react'

import { useWindowSize } from '@/hooks/useWindowSize'
import { useMiniApp, type MiniApp } from '@/contexts/MiniAppContext'
import { cn } from '@/utils/cn'
import { useAppStore } from '@/stores/useAppStore'

export default function HomePage() {
    const navigate = useNavigate();

    const { apps, miniAppState, openMiniApp, updateMiniAppOrigin, clearMiniApp } = useMiniApp();
    const { centerX, centerY, widthScreen, heightScreen } = useWindowSize();

    const settings = useAppStore((state) => state.settings);
    const appRefs = useRef<Record<string, HTMLDivElement | null>>({});

    useEffect(() => {
        if (miniAppState) {
            const rect = appRefs.current[miniAppState.path]?.getBoundingClientRect();
            if (!rect) return;

            updateMiniAppOrigin(rect);
        }
    }, [miniAppState?.isOpen])

    const handleOpenMiniApp = (event: React.MouseEvent<HTMLAnchorElement, MouseEvent>, app: MiniApp) => {
        event.preventDefault();

        openMiniApp({
            ...app,
            origin: event.currentTarget.getBoundingClientRect()
        });
    }

    const handleAnimationComplete = () => {
        if (!miniAppState) return

        if (!miniAppState.isOpen) {
            return clearMiniApp();
        }

        navigate(miniAppState.path);
    }

    return (
        <section className='relative flex h-full flex-col gap-8 overflow-y-auto p-6 font-mono text-[#c5e6ad]'>
            <div className='flex flex-wrap justify-center gap-8'>
                {apps.map((app) => (
                    <Link
                        key={app.path}
                        to={app.path}
                        onClick={(event) => handleOpenMiniApp(event, app)}
                        className={cn(
                            'group flex flex-col items-center gap-3 text-center',
                            {
                                'opacity-0': app.name == miniAppState?.name,
                                'animate-pulse': miniAppState && (app.name !== miniAppState?.name)
                            }
                        )}
                    >
                        <div ref={(element) => {
                            appRefs.current[app.path] = element;
                        }} className='size-18 relative flex aspect-square w-full max-w-25 items-center justify-center border border-[#5b9c3b]/30 bg-[#080e08] text-[#82aa6b] transition-all duration-200 group-hover:-translate-y-1 group-hover:border-[#8bc66a] group-hover:bg-[#101b0e] group-hover:text-[#c5e6ad]'>
                            {app.icon}
                        </div>

                        <p className='text-xs font-semibold tracking-wide'>
                            {app.name}
                        </p>
                    </Link>
                ))}
            </div>

            <AnimatePresence>
                {miniAppState && (
                    <motion.div
                        initial={{
                            position: 'fixed',
                            x: miniAppState?.isOpen ? miniAppState.origin?.x : centerX,
                            y: miniAppState?.isOpen ? miniAppState.origin?.y : centerY,
                            width: miniAppState?.isOpen ? widthScreen : 72,
                            height: miniAppState?.isOpen ? heightScreen : 72,
                            transform: miniAppState?.isOpen ? 'translate(0, 0)' : 'translate(-50%, -50%)'
                        }}
                        animate={{
                            left: miniAppState?.isOpen
                                ? [miniAppState.origin.x, centerX, centerX, centerX, centerX]
                                : [centerX, centerX, centerX, centerX, miniAppState.origin.x],
                            top: miniAppState?.isOpen
                                ? [miniAppState.origin.y, centerY, centerY, centerY, centerY]
                                : [centerY, centerY, centerY, centerY, miniAppState.origin.y],
                            width: miniAppState?.isOpen
                                ? [72, 72, widthScreen * 0.4, widthScreen, widthScreen]
                                : [widthScreen, widthScreen, widthScreen * 0.4, 72, 72],
                            height: miniAppState?.isOpen
                                ? [72, 72, heightScreen * 0.4, heightScreen, heightScreen]
                                : [heightScreen, heightScreen, heightScreen * 0.4, 72, 72],
                            transform: miniAppState?.isOpen
                                ? ['translate(0, 0)', 'translate(-50%, -50%)', 'translate(-50%, -50%)', 'translate(-50%, -50%)', 'translate(-50%, -50%)']
                                : ['translate(-50%, -50%)', 'translate(-50%, -50%)', 'translate(-50%, -50%)', 'translate(-50%, -50%)', 'translate(0, 0)']
                        }}
                        transition={{
                            duration: settings.transitionDuration,
                            ease: miniAppState?.isOpen
                                ? ['backInOut', 'backInOut', 'backInOut', 'backIn', 'backIn', 'easeIn']
                                : ['easeIn', 'backIn', 'backIn', 'backInOut', 'backInOut', 'backInOut'],
                            times: [0, 0.3, 0.5, 0.9, 1]
                        }}
                        onAnimationComplete={handleAnimationComplete}
                        className='z-100 flex items-center justify-center border border-[#5b9c3b]/40 bg-[#080e08] text-[#82aa6b]'
                    >
                        <motion.div
                            animate={{
                                scale: miniAppState?.isOpen
                                    ? [1, 1.1, 2, 3, 6]
                                    : [6, 3, 2, 1.1, 1],
                                opacity: miniAppState?.isOpen
                                    ? [1, 1, 1, 1, 0]
                                    : [0, 1, 1, 1, 1]
                            }}
                            transition={{
                                duration: settings.transitionDuration,
                                ease: miniAppState?.isOpen
                                    ? ['backInOut', 'backInOut', 'backInOut', 'backIn', 'backIn', 'easeIn']
                                    : ['easeIn', 'backIn', 'backIn', 'backInOut', 'backInOut', 'backInOut'],
                                times: [0, 0.3, 0.5, 0.9, 1]
                            }}
                        >
                            {miniAppState.icon}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </section>
    );
}
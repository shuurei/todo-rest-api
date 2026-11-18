import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router'
import { AnimatePresence, motion } from 'motion/react'
import { useWindowSize } from '@/hooks/useWindowSize'
import { useWallpaperField } from '@/hooks/useWallpaperField'
import { useMiniApp, type MiniApp } from '@/contexts/MiniAppContext'
import HomeContent from '@/components/HomeContent'
import HomeWallpaper from '@/components/HomeWallpaper'
import { useAuth } from '@/contexts/AuthContext'
import { defaultUserPreferences } from '@nodus/shared'

export default function HomePage() {
    const navigate = useNavigate();
    const { apps, miniAppState, openMiniApp, updateMiniAppOrigin, clearMiniApp } = useMiniApp();
    const { centerX, centerY, widthScreen, heightScreen } = useWindowSize();
    const { user } = useAuth();
    const settings = user?.preferences ?? defaultUserPreferences;
    const wallpaperField = useWallpaperField(settings.homeWallpaperMode);
    const activeWallpaper = settings[wallpaperField];
    const appRefs = useRef<Record<string, HTMLDivElement | null>>({});

    useEffect(() => {
        if (miniAppState) {
            const rect = appRefs.current[miniAppState.path]?.getBoundingClientRect();
            if (!rect) return;

            updateMiniAppOrigin(rect);
        }
    }, [miniAppState?.isOpen]);

    const handleOpenMiniApp = (event: React.MouseEvent<HTMLAnchorElement, MouseEvent>, app: MiniApp) => {
        event.preventDefault();

        openMiniApp({
            ...app,
            origin: appRefs.current[app.path]?.getBoundingClientRect() ?? event.currentTarget.getBoundingClientRect()
        });
    };
    
    const handleAnimationComplete = () => {
        if (!miniAppState) return;

        if (!miniAppState.isOpen) {
            return clearMiniApp();
        }

        navigate(miniAppState.path);
    };

    return (
        <section className='relative isolate h-full min-h-0 overflow-y-auto p-3 font-mono text-theme-text sm:p-6'>
            <HomeWallpaper wallpaper={activeWallpaper} blur={settings.homeWallpaperBlur} />

            <HomeContent
                apps={apps}
                miniAppState={miniAppState}
                appRefs={appRefs}
                onOpen={handleOpenMiniApp}
                settings={{ ...settings, homeWallpaper: activeWallpaper }}
            />

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
                                ? [
                                      'translate(0, 0)',
                                      'translate(-50%, -50%)',
                                      'translate(-50%, -50%)',
                                      'translate(-50%, -50%)',
                                      'translate(-50%, -50%)'
                                  ]
                                : [
                                      'translate(-50%, -50%)',
                                      'translate(-50%, -50%)',
                                      'translate(-50%, -50%)',
                                      'translate(-50%, -50%)',
                                      'translate(0, 0)'
                                  ]
                        }}
                        transition={{
                            duration: settings.transitionDuration,
                            ease: miniAppState?.isOpen
                                ? ['backInOut', 'backInOut', 'backInOut', 'backIn', 'backIn', 'easeIn']
                                : ['easeIn', 'backIn', 'backIn', 'backInOut', 'backInOut', 'backInOut'],
                            times: [0, 0.3, 0.5, 0.9, 1]
                        }}
                        onAnimationComplete={handleAnimationComplete}
                        className="z-100 flex items-center justify-center border border-theme-border/40 bg-theme-surface text-theme-muted"
                    >
                        <motion.div
                            animate={{
                                scale: miniAppState?.isOpen ? [1, 1.1, 2, 3, 6] : [6, 3, 2, 1.1, 1],
                                opacity: miniAppState?.isOpen ? [1, 1, 1, 1, 0] : [0, 1, 1, 1, 1]
                            }}
                            transition={{
                                duration: settings.transitionDuration,
                                ease: miniAppState?.isOpen
                                    ? ['backInOut', 'backInOut', 'backInOut', 'backIn', 'backIn', 'easeIn']
                                    : ['easeIn', 'backIn', 'backIn', 'backInOut', 'backInOut', 'backInOut'],
                                times: [0, 0.3, 0.5, 0.9, 1]
                            }}
                        >
                            <miniAppState.Icon size={28} />
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </section>
    );
}

import { useEffect, useRef, useState, type MouseEvent, type PointerEvent, type RefObject } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router';
import { motion, useMotionValue, useReducedMotion } from 'motion/react';
import { useTranslation } from 'react-i18next';
import type { HomeAppPath } from '@todo/shared';
import { UserAPI } from '@/api/UserAPI';
import { useAuth } from '@/contexts/AuthContext';
import type { MiniApp, MiniAppState } from '@/contexts/MiniAppContext';
import { translateError } from '@/i18n';
import { getApiErrorCode } from '@/utils/api-error';
import { findAppSlot, mergeAppOrder, reorderApp, type AppSlot } from '@/utils/home-app-order';
import { cn } from '@/utils/cn';

type Props = {
    apps: MiniApp[];
    miniAppState: MiniAppState | null;
    appRefs: RefObject<Record<string, HTMLDivElement | null>>;
    onOpen: (event: MouseEvent<HTMLAnchorElement>, app: MiniApp) => void;
    hasWallpaper: boolean;
};

type Gesture = {
    id: number;
    path: HomeAppPath;
    startX: number;
    startY: number;
    offsetX: number;
    offsetY: number;
    active: boolean;
    order: HomeAppPath[];
    slots: AppSlot[];
    timer: ReturnType<typeof setTimeout>;
};

const holdDuration = 450;

export default function HomeApps({ apps, miniAppState, appRefs, onOpen, hasWallpaper }: Props) {
    const { t } = useTranslation();
    const { user, getUser } = useAuth();
    const [draft, setDraft] = useState<HomeAppPath[] | null>(null);
    const [dragging, setDragging] = useState<HomeAppPath | null>(null);
    const [isPending, setIsPending] = useState(false);
    const [feedback, setFeedback] = useState<{
        error?: string;
        saved?: boolean;
    }>({});
    const gridRef = useRef<HTMLDivElement>(null);
    const gestureRef = useRef<Gesture | null>(null);
    const savingRef = useRef(false);
    const suppressClickUntil = useRef(0);
    const mounted = useRef(true);
    const x = useMotionValue(0);
    const y = useMotionValue(0);
    const reduceMotion = useReducedMotion();
    const orderedApps = draft ? [...apps].sort((a, b) => draft.indexOf(a.path) - draft.indexOf(b.path)) : apps;
    const floatingApp = apps.find((app) => app.path === dragging);

    useEffect(() => {
        mounted.current = true;

        const interrupt = () => cancelGesture();

        window.addEventListener('scroll', interrupt, true);

        window.addEventListener('resize', interrupt);

        return () => {
            window.removeEventListener('scroll', interrupt, true);

            window.removeEventListener('resize', interrupt);

            mounted.current = false;

            if (gestureRef.current) {
                clearTimeout(gestureRef.current.timer);
            }

            gestureRef.current = null;
        };
    }, []);

    useEffect(() => {
        if (!dragging) {
            return;
        }

        const cursor = document.body.style.cursor;
        const userSelect = document.body.style.userSelect;

        document.body.style.cursor = 'grabbing';

        document.body.style.userSelect = 'none';

        const cancel = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                cancelGesture();
            }
        };
        const blur = () => cancelGesture();

        window.addEventListener('keydown', cancel);

        window.addEventListener('blur', blur);

        return () => {
            document.body.style.cursor = cursor;

            document.body.style.userSelect = userSelect;

            window.removeEventListener('keydown', cancel);

            window.removeEventListener('blur', blur);
        };
    }, [dragging]);

    function releaseGesture() {
        const gesture = gestureRef.current;

        if (!gesture) {
            return null;
        }

        clearTimeout(gesture.timer);

        gestureRef.current = null;

        if (gridRef.current?.hasPointerCapture(gesture.id)) {
            gridRef.current.releasePointerCapture(gesture.id);
        }

        if (gesture.active) {
            suppressClickUntil.current = Date.now() + 500;
        }

        setDragging(null);

        return gesture;
    }

    function cancelGesture() {
        const gesture = releaseGesture();

        if (gesture?.active) {
            setDraft(null);
        }
    }

    async function saveOrder(order: HomeAppPath[]) {
        if (!user || savingRef.current) {
            return;
        }

        if (order.join('|') === apps.map((app) => app.path).join('|')) {
            setDraft(null);

            return;
        }

        savingRef.current = true;

        setIsPending(true);

        setDraft(order);

        setFeedback({});

        try {
            await UserAPI.updatePreferences({
                appOrder: mergeAppOrder(order, user.preferences.appOrder)
            });

            const current = getUser();

            if (current?.id !== user.id) {
                return;
            }

            if (mounted.current) {
                setFeedback({
                    saved: true
                });
            }
        } catch (failure) {
            if (mounted.current) {
                setFeedback({
                    error: getApiErrorCode(failure)
                });
            }
        } finally {
            savingRef.current = false;

            if (mounted.current) {
                setIsPending(false);

                setDraft(null);
            }
        }
    }

    function startPress(event: PointerEvent<HTMLAnchorElement>, path: HomeAppPath) {
        if (
            savingRef.current ||
            miniAppState ||
            !user ||
            !event.isPrimary ||
            event.button !== 0 ||
            gestureRef.current
        ) {
            return;
        }

        const tile = event.currentTarget.getBoundingClientRect();
        const gesture: Gesture = {
            id: event.pointerId,
            path,
            startX: event.clientX,
            startY: event.clientY,
            offsetX: event.clientX - tile.left,
            offsetY: event.clientY - tile.top,
            active: false,
            order: apps.map((app) => app.path),
            slots: [],
            timer: setTimeout(() => {
                if (gestureRef.current !== gesture || !gridRef.current) {
                    return;
                }

                gesture.slots = Array.from(gridRef.current.querySelectorAll<HTMLElement>('[data-app-path]')).map(
                    (element) => element.getBoundingClientRect()
                );

                gesture.active = true;

                suppressClickUntil.current = Infinity;

                x.set(gesture.startX - gesture.offsetX);

                y.set(gesture.startY - gesture.offsetY);

                gridRef.current.setPointerCapture(gesture.id);

                setDraft(gesture.order);

                setDragging(path);

                setFeedback({});
            }, holdDuration)
        };

        gestureRef.current = gesture;
    }

    function updateDrag(event: PointerEvent<HTMLDivElement>) {
        const gesture = gestureRef.current;

        if (!gesture || gesture.id !== event.pointerId) {
            return;
        }

        if (!gesture.active) {
            if (Math.hypot(event.clientX - gesture.startX, event.clientY - gesture.startY) > 10) {
                suppressClickUntil.current = Date.now() + 500;

                cancelGesture();
            }

            return;
        }

        event.preventDefault();

        x.set(event.clientX - gesture.offsetX);

        y.set(event.clientY - gesture.offsetY);

        const index = findAppSlot(gesture.slots, event.clientX, event.clientY);
        const slot = gesture.slots[index];

        if (!slot) {
            return;
        }

        const next = reorderApp(gesture.order, gesture.path, index, event.clientX > slot.left + slot.width / 2);

        if (next !== gesture.order) {
            gesture.order = next;

            setDraft(next);
        }
    }

    function finishDrag(event: PointerEvent<HTMLDivElement>) {
        if (gestureRef.current?.id !== event.pointerId) {
            return;
        }

        updateDrag(event);

        const gesture = releaseGesture();

        if (!gesture?.active) {
            return;
        }

        const bounds = gridRef.current?.getBoundingClientRect();

        if (
            !bounds ||
            event.clientX < bounds.left - 24 ||
            event.clientX > bounds.right + 24 ||
            event.clientY < bounds.top - 24 ||
            event.clientY > bounds.bottom + 24
        ) {
            return setDraft(null);
        }

        saveOrder(gesture.order);
    }

    return (
        <div className="relative flex flex-col gap-6">
            <p id="home-drag-help" className="sr-only">
                {t('home.dragHelp')}
            </p>
            <p role="status" aria-live="polite" className="sr-only">
                {dragging
                    ? t('home.moveApp', {
                          name: floatingApp?.name
                      })
                    : isPending
                      ? t('common.saving')
                      : feedback.saved
                        ? t('home.orderSaved')
                        : ''}
            </p>
            {feedback.error && (
                <p role="alert" className="self-center bg-theme-surface/90 p-3 text-xs text-red-400">
                    {translateError(feedback.error)}
                </p>
            )}
            <div
                ref={gridRef}
                onPointerMove={updateDrag}
                onPointerUp={finishDrag}
                onPointerCancel={cancelGesture}
                onLostPointerCapture={(event) => {
                    if (event.target === event.currentTarget) {
                        cancelGesture();
                    }
                }}
                onPointerLeave={() => {
                    if (gestureRef.current && !gestureRef.current.active) {
                        cancelGesture();
                    }
                }}
                aria-label={t('home.applications')}
                aria-busy={isPending}
                className="flex flex-wrap justify-center gap-6 sm:gap-8"
            >
                {orderedApps.map((app) => (
                    <motion.div
                        key={app.path}
                        data-app-path={app.path}
                        layout={reduceMotion ? false : 'position'}
                        transition={{
                            type: 'spring',
                            stiffness: 450,
                            damping: 35
                        }}
                        className="w-24"
                    >
                        <Link
                            to={app.path}
                            draggable={false}
                            aria-describedby="home-drag-help"
                            onDragStart={(event) => event.preventDefault()}
                            onContextMenu={(event) => event.preventDefault()}
                            onPointerDown={(event) => startPress(event, app.path)}
                            onClick={(event) => {
                                if (dragging || (event.detail !== 0 && Date.now() < suppressClickUntil.current)) {
                                    event.preventDefault();

                                    return;
                                }

                                onOpen(event, app);
                            }}
                            onKeyDown={(event) => {
                                if (
                                    !event.altKey ||
                                    !['ArrowLeft', 'ArrowUp', 'ArrowRight', 'ArrowDown'].includes(event.key)
                                ) {
                                    return;
                                }

                                event.preventDefault();

                                if (savingRef.current || miniAppState || gestureRef.current) {
                                    return;
                                }

                                const order = apps.map((item) => item.path);
                                const from = order.indexOf(app.path);
                                const direction = event.key === 'ArrowLeft' || event.key === 'ArrowUp' ? -1 : 1;
                                const target = from + direction;

                                if (target < 0 || target >= order.length) {
                                    return;
                                }

                                void saveOrder(reorderApp(order, app.path, target, direction > 0));
                            }}
                            className={cn(
                                'group flex w-24 touch-none select-none flex-col items-center gap-3 text-center focus-visible:outline-2 focus-visible:outline-theme-accent',
                                {
                                    'opacity-0': app.path === miniAppState?.path,
                                    'animate-pulse': !!miniAppState && app.path !== miniAppState.path,
                                    'opacity-20': dragging === app.path
                                }
                            )}
                        >
                            <div
                                ref={(element) => {
                                    appRefs.current[app.path] = element;
                                }}
                                className={cn(
                                    'relative flex size-18 shrink-0 items-center justify-center border border-theme-border/40 bg-theme-surface/95 text-theme-muted group-hover:border-theme-accent group-hover:text-theme-highlight',
                                    dragging === app.path && 'border-dashed border-theme-accent'
                                )}
                            >
                                <app.Icon aria-hidden size={28} />
                            </div>
                            <span
                                className={cn(
                                    'max-w-full px-2 py-1 text-xs font-semibold text-theme-text',
                                    hasWallpaper && 'bg-theme-surface/90'
                                )}
                            >
                                {app.name}
                            </span>
                        </Link>
                    </motion.div>
                ))}
            </div>
            {floatingApp &&
                createPortal(
                    <motion.div
                        aria-hidden
                        data-dragging-app={floatingApp.path}
                        initial={{
                            scale: 1,
                            rotate: 0
                        }}
                        animate={{
                            scale: reduceMotion ? 1 : 1.12,
                            rotate: reduceMotion ? 0 : -4
                        }}
                        transition={{
                            type: 'spring',
                            stiffness: 450,
                            damping: 25
                        }}
                        style={{
                            x,
                            y
                        }}
                        className="pointer-events-none fixed top-0 left-0 z-200 flex w-24 flex-col items-center gap-3 text-center font-mono"
                    >
                        <div className="flex size-18 items-center justify-center border border-theme-accent bg-theme-surface text-theme-highlight shadow-2xl shadow-black/60">
                            <floatingApp.Icon size={28} />
                        </div>
                        <span className="max-w-full bg-theme-surface/95 px-2 py-1 text-xs font-semibold text-theme-text">
                            {floatingApp.name}
                        </span>
                    </motion.div>,
                    document.body
                )}
        </div>
    );
}

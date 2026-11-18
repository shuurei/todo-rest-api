import { useEffect, useId, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { LuX } from 'react-icons/lu';

export default function Dialog({
    title,
    onClose,
    isPending,
    children
}: {
    title: string;
    onClose: () => void;
    isPending: boolean;
    children: ReactNode;
}) {
    const { t } = useTranslation();
    const dialogRef = useRef<HTMLDialogElement>(null);
    const titleId = useId();

    useEffect(() => {
        const dialog = dialogRef.current;
        const previousFocus = document.activeElement;
        const previousOverflow = document.body.style.overflow;

        document.body.style.overflow = 'hidden';

        dialog?.showModal();

        return () => {
            dialog?.close();

            document.body.style.overflow = previousOverflow;

            if (previousFocus instanceof HTMLElement && previousFocus.isConnected) {
                previousFocus.focus();
            }
        };
    }, []);

    return createPortal(
        <dialog
            ref={dialogRef}
            aria-labelledby={titleId}
            onCancel={(event) => {
                event.preventDefault();

                if (!isPending) {
                    onClose();
                }
            }}
            className="fixed inset-0 m-0 h-dvh max-h-dvh w-screen max-w-none flex-col overflow-hidden border border-theme-border/30 bg-theme-surface p-0 font-mono text-theme-text shadow-2xl backdrop:bg-black/70 open:flex sm:inset-auto sm:left-1/2 sm:top-1/2 sm:h-auto sm:max-h-[90dvh] sm:w-[calc(100%_-_3rem)] sm:max-w-xl sm:-translate-x-1/2 sm:-translate-y-1/2"
        >
            <header className="flex shrink-0 items-center justify-between gap-4 border-b border-theme-border/20 px-5 py-4">
                <h2 id={titleId} className="min-w-0 text-base font-bold sm:text-lg">
                    {title}
                </h2>
                <button
                    type="button"
                    aria-label={t('common.close')}
                    disabled={isPending}
                    onClick={onClose}
                    className="flex size-11 shrink-0 cursor-pointer items-center justify-center border border-theme-border/30 text-theme-muted hover:border-theme-accent hover:text-theme-highlight focus-visible:outline-2 focus-visible:outline-theme-accent disabled:opacity-50"
                >
                    <LuX aria-hidden size={22} />
                </button>
            </header>
            <div className="flex min-h-0 flex-1 flex-col overflow-y-auto sm:flex-initial">{children}</div>
        </dialog>,
        document.body
    );
}

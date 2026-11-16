import { useEffect, useId, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal } from '@/components/Modal';
import Button from '@/components/common/Button';

export default function ConnectionDialog({ retryAt, fatalCode }: { retryAt: number | null; fatalCode: number | null }) {
    const { t } = useTranslation();
    const dialog = useRef<HTMLDialogElement>(null);
    const titleId = useId();
    const messageId = useId();
    const [now, setNow] = useState(Date.now);

    useEffect(() => {
        const element = dialog.current;

        element?.showModal();

        const timer = setInterval(() => setNow(Date.now()), 250);

        return () => {
            clearInterval(timer);

            element?.close();
        };
    }, []);

    const seconds = retryAt ? Math.min(5, Math.max(1, Math.ceil((retryAt - now) / 1000))) : null;

    return (
        <dialog
            ref={dialog}
            aria-labelledby={titleId}
            aria-describedby={messageId}
            onCancel={(event) => event.preventDefault()}
            className="fixed inset-0 m-auto w-[calc(100%_-_2rem)] max-w-md border-0 bg-transparent p-0 font-mono text-theme-text backdrop:bg-black/80"
        >
            <Modal>
                <Modal.Header>
                    <h1 id={titleId} className="text-xs uppercase tracking-widest">
                        {t('connection.unavailable')}
                    </h1>
                </Modal.Header>
                <Modal.Content>
                    <p id={messageId} className="text-sm leading-relaxed">
                        {t('connection.description')}
                    </p>
                    <p role="status" className="mt-4 text-xs text-theme-highlight">
                        {fatalCode
                            ? t('connection.fatal', {
                                  code: fatalCode
                              })
                            : seconds === null
                              ? t('connection.connecting')
                              : t('connection.retryIn', {
                                    count: seconds
                                })}
                    </p>
                </Modal.Content>
                {fatalCode && (
                    <Modal.Footer>
                        <Button type="button" onClick={() => window.location.reload()}>
                            {t('connection.reload')}
                        </Button>
                    </Modal.Footer>
                )}
            </Modal>
        </dialog>
    );
}

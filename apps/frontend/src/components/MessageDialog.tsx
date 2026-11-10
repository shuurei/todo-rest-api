import { useEffect, useId, useRef } from 'react'
import { Modal } from '@/components/Modal'
import Button from '@/components/common/Button'

export default function MessageDialog({ title, message, action, onClose }: {
    title: string;
    message: string;
    action: string;
    onClose: () => void;
}) {
    const dialog = useRef<HTMLDialogElement>(null);
    const titleId = useId();
    const messageId = useId();

    useEffect(() => {
        const element = dialog.current;
        element?.showModal();
        return () => element?.close();
    }, []);

    return (
        <dialog ref={dialog} aria-labelledby={titleId} aria-describedby={messageId}
            onCancel={(event) => { event.preventDefault(); onClose(); }}
            className='fixed inset-0 m-auto w-[calc(100%_-_2rem)] max-w-md border-0 bg-transparent p-0 font-mono text-theme-text backdrop:bg-black/70'>
            <Modal>
                <Modal.Header><h1 id={titleId} className='text-xs uppercase tracking-widest'>{title}</h1></Modal.Header>
                <Modal.Content><p id={messageId} className='text-sm'>{message}</p></Modal.Content>
                <Modal.Footer><Button type='button' onClick={onClose}>{action}</Button></Modal.Footer>
            </Modal>
        </dialog>
    );
}

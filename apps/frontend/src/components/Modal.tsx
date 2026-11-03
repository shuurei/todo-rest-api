import { AnimatePresence, motion, type HTMLMotionProps } from 'motion/react'
import { cn } from '@/utils/cn'

Modal.Header = ({ children, className, ...props }: React.HTMLAttributes<HTMLDivElement>) => {
    return (
        <div {...props} className={cn(
            'flex border-b border-[#5b9c3b]/30 bg-[#5b9c3b]/6 px-5 py-3',
            className
        )}>
            {children}
        </div>
    );
}

Modal.Content = ({ children, className, ...props }: React.HTMLAttributes<HTMLDivElement>) => {
    return (
        <div {...props} className={cn('px-5 py-7 sm:p-8', className)}>
            {children}
        </div>
    );
}

Modal.Footer = ({ children, className, ...props }: React.HTMLAttributes<HTMLDivElement>) => {
    return (
        <div {...props} className={cn(
            'flex border-t text-[#527a43] border-[#5b9c3b]/30 text-[10px] px-5 py-3 tracking-widest',
            className
        )}>
            {children}
        </div>
    );
}

export function Modal({ children, className, ...props }: HTMLMotionProps<'div'>) {
    return (
        <AnimatePresence mode='wait'>
            <motion.div
                {...props}
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 1, 1, 0, 1, 0, 1] }}
                transition={{
                    duration: 0.27,
                    times: [0, 0.15, 0.3, 0.45, 0.6, 0.75, 1]
                }}
                className={cn(
                    'border overflow-hidden border-[#5b9c3b]/40 bg-[#101910]/90 border-y',
                    className
                )}
            >
                {children}
            </motion.div>
        </AnimatePresence>
    );
}
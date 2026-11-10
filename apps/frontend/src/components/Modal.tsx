import { AnimatePresence, motion, type HTMLMotionProps } from 'motion/react'
import { cn } from '@/utils/cn'

Modal.Header = ({ children, className, ...props }: React.HTMLAttributes<HTMLDivElement>) => {
    return (
        <div {...props} className={cn(
            'sticky top-0 z-20 flex border-b border-theme-border/30 bg-theme-panel px-5 py-3',
            className
        )}>
            {children}
        </div>
    );
}

Modal.Content = ({ children, className, ...props }: React.HTMLAttributes<HTMLDivElement>) => {
    return (
        <div {...props} className={cn('px-5 py-7 sm:p-8 overflow-visible', className)}>
            {children}
        </div>
    );
}

Modal.Footer = ({ children, className, ...props }: React.HTMLAttributes<HTMLDivElement>) => {
    return (
        <div {...props} className={cn(
            'flex border-t text-theme-dim border-theme-border/30 text-[10px] px-5 py-3 tracking-widest',
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
                    'relative border overflow-hidden border-theme-border/40 bg-theme-panel/90 border-y min-h-0 overflow-y-auto',
                    className
                )}
            >
                {children}
            </motion.div>
        </AnimatePresence>
    );
}
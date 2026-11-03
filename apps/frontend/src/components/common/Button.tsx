import type { ButtonHTMLAttributes } from 'react'
import { cn } from '@/utils/cn'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    loading?: boolean;
}

export default function Button({ children, loading = false, disabled, className, ...props }: ButtonProps) {
    return (
        <button
            disabled={disabled || loading}
            className={cn(
                'flex w-full items-center justify-center gap-2 px-4 py-3 cursor-pointer',
                'text-sm font-semibold transition-all duration-200',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500',
                'disabled:cursor-not-allowed disabled:opacity-50',
                className
            )}
            {...props}
        >
            {loading && (
                <span className="h-4 w-4 animate-spin border-2 border-current border-r-transparent" />
            )}

            {children}
        </button>
    );
}

import type { InputHTMLAttributes } from 'react'
import { cn } from '@/utils/cn'

interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
    label?: string;
}

export default function Checkbox({ label, className,
    ...props }: CheckboxProps) {
    return (
        <label
            className={cn(
                'inline-flex w-fit items-center gap-3 cursor-pointer select-none',
                'has-disabled:cursor-not-allowed',
                className
            )}
        >
            <span className="relative flex size-6 shrink-0 items-center justify-center border border-theme-border/40 bg-theme-hover p-1">
                <input
                    type="checkbox"
                    className={cn(
                        'peer absolute inset-0 z-10 h-full w-full cursor-pointer appearance-none',
                        'disabled:cursor-not-allowed'
                    )}
                    {...props}
                />

                <span
                    className={cn(
                        'flex h-full w-full items-center justify-center',
                        'peer-checked:border-theme-accent peer-checked:bg-theme-accent',
                        'peer-focus-visible:ring-2 peer-focus-visible:ring-theme-accent/50',
                        'peer-disabled:opacity-50'
                    )}
                />
            </span>

            {label && (
                <span className='text-xs text-theme-text'>
                    {label}
                </span>
            )}
        </label>
    );
}

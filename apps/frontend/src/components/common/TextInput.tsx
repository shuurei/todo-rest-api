import type { InputHTMLAttributes } from 'react'
import { cn } from '@/utils/cn'

import ScrambleText from '../ScrambleText'

interface TextInputProps extends InputHTMLAttributes<HTMLInputElement> {
    label: string;
    error?: string | null;
    showLabelError?: boolean;
}

export default function TextInput({
    id,
    label,
    error,
    showLabelError = true,
    className,
    ...props
}: TextInputProps) {
    return (
        <div className='space-y-3'>
            <label className='text-xs font-bold uppercase tracking-widest text-theme-highlight'>
                <ScrambleText text={label} duration={500} />

                <input
                    id={id}
                    className={cn(
                        'w-full rounded-none border border-theme-border/30 bg-theme-surface px-4 py-3',
                        'font-mono text-sm text-theme-text outline-none',
                        'placeholder:text-theme-dim',
                        'focus:border-theme-accent focus:ring-1 focus:ring-theme-accent/30',
                        error && 'bg-[#1a0707] placeholder:text-[#633e3e] text-[#e6adad] border-red-500 focus:border-red-500 focus:ring-red-500/20',
                        className
                    )}
                    {...props}
                />
            </label>

            {(showLabelError && (error && error.length > 0)) && (
                <ScrambleText
                    as='p'
                    className='text-red-400 text-xs mt-0.5'
                    text={error}
                />
            )}
        </div>
    );
}
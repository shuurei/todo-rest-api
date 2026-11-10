import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { InputHTMLAttributes } from 'react'
import { cn } from '@/utils/cn'

import ScrambleText from '../ScrambleText'

interface PasswordInputProps extends InputHTMLAttributes<HTMLInputElement> {
    label: string;
    error?: string | null;
    showLabelError?: boolean;
}

export default function PasswordInput({
    id,
    label,
    error,
    showLabelError = true,
    className,
    ...props
}: PasswordInputProps) {
    const { t } = useTranslation();
    const [visible, setVisible] = useState(false);

    return (
        <div className='space-y-3'>
            <label className='text-xs font-bold uppercase tracking-widest text-theme-highlight'>
                <ScrambleText text={label} duration={5000} />

                <div className='relative'>
                    <input
                        id={id}
                        type={visible ? 'text' : 'password'}
                        className={cn(
                            'w-full rounded-none border border-theme-border/30 bg-theme-surface',
                            'px-4 py-3 pr-24 font-mono text-sm text-theme-text outline-none',
                            'placeholder:text-theme-dim',
                            'focus:border-theme-accent focus:ring-1 focus:ring-theme-accent/30',
                            error && 'bg-[#1a0707] placeholder:text-[#633e3e] text-[#e6adad] border-red-500 focus:border-red-500 focus:ring-red-500/20',
                            className
                        )}
                        {...props}
                    />

                    <ScrambleText
                        as='button'
                        type='button'
                        onClick={(event) => {
                            event.preventDefault();
                            setVisible((value) => !value);
                        }}
                        className={cn(
                            'absolute inset-y-0 right-4 text-xs font-medium text-zinc-500 transition hover:text-theme-text cursor-pointer',
                            error && 'hover:text-[#e6adad]'
                        )}
                        text={t(visible ? 'common.hidePassword' : 'common.showPassword')}
                        duration={500}
                    />
                </div>
            </label>

            {(showLabelError && (error && error.length > 0)) && (
                <ScrambleText
                    as='p'
                    className='text-red-400 text-xs mt-1.5'
                    text={error}
                />
            )}
        </div>
    );
}
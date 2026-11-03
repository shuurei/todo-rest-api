import { useState } from 'react'
import type { InputHTMLAttributes } from 'react'
import { cn } from '@/utils/cn'

import ScrambleText from '../ScrambleText'

interface PasswordInputProps extends InputHTMLAttributes<HTMLInputElement> {
    label: string;
    error?: string;
}

export default function PasswordInput({ label, error, id, className, ...props }: PasswordInputProps) {
    const [visible, setVisible] = useState(false)

    return (
        <div className='space-y-3'>
            <label className='text-xs font-bold uppercase tracking-widest text-[#a8d887]'>
                <ScrambleText text={label} duration={5000} />

                <div className='relative'>
                    <input
                        id={id}
                        type={visible ? 'text' : 'password'}
                        className={cn(
                            'w-full rounded-none border border-[#5b9c3b]/30 bg-[#080e08]',
                            'px-4 py-3 pr-16 font-mono text-sm text-[#c5e6ad] outline-none',
                            'placeholder:text-[#49633e]',
                            'focus:border-[#8bc66a] focus:ring-1 focus:ring-[#8bc66a]/30',
                            error && 'border-red-500 focus:border-red-500 focus:ring-red-500/20',
                            className
                        )}
                        {...props}
                    />

                    <ScrambleText
                        as='button'
                        onClick={(event) => {
                            event.preventDefault();
                            setVisible(value => !value)
                        }}
                        className='absolute inset-y-0 right-4 text-xs font-medium text-zinc-500 transition hover:text-[#c5e6ad] cursor-pointer'
                        text={visible ? '[HIDE]' : '[SHOW]'}
                        duration={500}
                    />
                </div>
            </label>

            {error && (
                <ScrambleText
                    className='text-red-400 text-xs'
                    text={error}
                    as='p'
                />
            )}
        </div>
    );
}
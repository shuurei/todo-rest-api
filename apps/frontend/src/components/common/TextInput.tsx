import type { InputHTMLAttributes } from 'react'
import { cn } from '@/utils/cn'

import ScrambleText from '../ScrambleText'

interface TextInputProps extends InputHTMLAttributes<HTMLInputElement> {
    label: string;
    error?: string;
}

export default function TextInput({ label, error, id, className, ...props }: TextInputProps) {
    return (
        <div className='space-y-3'>
            <label className='text-xs font-bold uppercase tracking-widest text-[#a8d887]'>
                <ScrambleText text={label} duration={500} />

                <input
                    id={id}
                    className={cn(
                        'w-full rounded-none border border-[#5b9c3b]/30 bg-[#080e08] px-4 py-3',
                        'font-mono text-sm text-[#c5e6ad] outline-none',
                        'placeholder:text-[#49633e]',
                        'focus:border-[#8bc66a] focus:ring-1 focus:ring-[#8bc66a]/30',
                        error && 'border-red-500 focus:border-red-500 focus:ring-red-500/20',
                        className
                    )}
                    {...props}
                />
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
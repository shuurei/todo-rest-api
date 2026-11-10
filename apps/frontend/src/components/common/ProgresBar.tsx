import { useEffect, useMemo, useState, type HTMLAttributes } from 'react'
import { cn } from '@/utils/cn'

interface ProgressBarBaseProps extends Omit<HTMLAttributes<HTMLDivElement>, 'role'> {
    label?: string;
    error?: string;
    segments?: number;
}

interface InfiniteProgressBarProps extends ProgressBarBaseProps {
    infinite: true;
    value?: never;
    max?: never;
    duration?: number;
    activeSegmentsCount?: number;
}

interface ProgressBarProps extends ProgressBarBaseProps {
    infinite?: false;
    value?: number | string;
    max?: number | string;
    duration?: never;
    activeSegmentsCount?: never;
};

const generateInfinitePattern = (segments: number, activeSegments = 3) => {
    return Array.from({ length: segments }, (_, step) => Array.from(
        { length: activeSegments },
        (_, offset) => (step + offset) % segments
    ));
}

export default function ProgressBar({
    value = 0,
    max = 100,
    label,
    error,
    segments = 10,
    infinite,
    className,
    activeSegmentsCount = 3,
    duration = 250,
    ...props
}: ProgressBarProps | InfiniteProgressBarProps) {
    const [step, setStep] = useState(0);
    const INFINITE_PATTERN = useMemo(() => generateInfinitePattern(segments, activeSegmentsCount), [segments, activeSegmentsCount]);

    useEffect(() => {
        if (!infinite) {
            return setStep(0);
        }

        const interval = setInterval(() => {
            setStep((current) => (current + 1) % INFINITE_PATTERN.length);
        }, duration);

        return () => clearInterval(interval);
    }, [infinite, INFINITE_PATTERN, duration]);

    const safeMax = Math.max(0, Number(max) || 0);
    const safeValue = Math.min(Math.max(0, Number(value) || 0), safeMax);

    const percentage = safeMax > 0 ? (safeValue / safeMax) * 100 : 0
    const filledSegments = Math.round((percentage / 100) * segments);
    const activeSegments = INFINITE_PATTERN[step % INFINITE_PATTERN.length];

    return (
        <div {...props} className={cn('flex w-full flex-col gap-2', className)}>
            <div className='flex items-center justify-between'>
                <label className='text-sm text-theme-text'>
                    {label}
                </label>

                {!infinite && (
                    <span className='text-sm text-theme-accent'>
                        {Math.round(percentage)}%
                    </span>
                )}
            </div>

            <div role='progressbar' className='flex w-full gap-1'>
                {Array.from({ length: segments }, (_, index) => {
                    const isActive = infinite
                        ? activeSegments.includes(index)
                        : index < filledSegments;

                    return (
                        <span
                            key={index}
                            className={cn(
                                'size-6.5 flex-1 bg-theme-deep transition-colors duration-100',
                                isActive && 'bg-theme-accent',
                            )}
                        />
                    )
                },
                )}
            </div>

            {error && (
                <p className='text-sm text-red-500'>
                    {error}
                </p>
            )}
        </div>
    );
}

import { useEffect, useState } from 'react'
import type { ElementType, ComponentPropsWithoutRef } from 'react'

interface ScrambleTextOwnProps {
    text: string;
    duration?: number;
}

type ScrambleTextProps<T extends ElementType = 'span'> = ScrambleTextOwnProps & {
    as?: T
} & Omit<ComponentPropsWithoutRef<T>, keyof ScrambleTextOwnProps | 'as'>

const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%&*+-_';

const getRandomCharacter = () => {
    return characters[Math.floor(Math.random() * characters.length)];
}

const scramble = (text: string, revealed: number) => {
    return text
        .split('')
        .map((char, index) => {
            if (char === ' ' || index < revealed) {
                return char;
            }

            return getRandomCharacter();
        })
        .join('');
}

export default function ScrambleText<T extends ElementType = 'span'>({ text, duration = 500, as, ...props }: ScrambleTextProps<T>) {
    const Component = as ?? 'span';
    const [display, setDisplay] = useState(() => scramble(text, 0));

    useEffect(() => {
        let revealed = 0

        setDisplay(scramble(text, 0));

        const interval = setInterval(() => {
            revealed += Math.max(1, Math.ceil(text.length / duration));

            if (revealed >= text.length) {
                setDisplay(text);
                return clearInterval(interval);
            }

            setDisplay(scramble(text, revealed));
        }, 60);

        return () => clearInterval(interval)
    }, [text, duration]);

    return (
        <Component {...props}>
            {display}
        </Component>
    );
}

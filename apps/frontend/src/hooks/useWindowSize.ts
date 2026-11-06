import { useState, useEffect } from 'react'

export const useWindowSize = () => {
    const getSize = () => {
        const width = window.innerWidth;
        const height = window.innerHeight;

        return {
            widthScreen: width,
            heightScreen: height,
            centerX: width / 2,
            centerY: height / 2
        };
    };

    const [windowSize, setWindowSize] = useState(getSize);

    useEffect(() => {
        const handleResize = () => {
            setWindowSize(getSize());
        }

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return windowSize;
}

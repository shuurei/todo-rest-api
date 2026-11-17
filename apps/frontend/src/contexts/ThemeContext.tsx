import { createContext, useContext, useEffect, useLayoutEffect, useMemo, useState, type ReactNode } from 'react'
import { defaultUserPreferences, type UserPreferences } from '@todo/shared'
import { useAuth } from '@/contexts/AuthContext'
import { extractImagePalette, type ImagePalette } from '@/utils/image-palette'
import { getWallpaperUrl } from '@/utils/wallpaper'

type ThemePreview = Partial<Pick<UserPreferences, 'themeColor' | 'themeFromWallpaper' | 'homeWallpaper'>> & {
    wallpaperPreviewUrl?: string | null;
};

type DynamicStatus = 'idle' | 'loading' | 'ready' | 'unavailable';

interface ThemeContextValue {
    setPreview: (preview: ThemePreview | null) => void;
    dynamicStatus: DynamicStatus;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
    const { user } = useAuth();

    const [preview, setPreview] = useState<ThemePreview | null>(null);

    const preferences = {
        ...(user?.preferences ?? defaultUserPreferences),
        ...preview
    };

    const source = preferences.themeFromWallpaper
        ? (preview?.wallpaperPreviewUrl ?? getWallpaperUrl(preferences.homeWallpaper))
        : null;

    const [result, setResult] = useState<{
        source: string;
        palette: ImagePalette | null;
    } | null>(null);

    useEffect(() => {
        if (!source) return;

        let active = true;
        void extractImagePalette(source).then((palette) => {
            if (active) setResult({ source, palette });
        });
        return () => { active = false; };
    }, [source]);

    const palette = source && result?.source === source ? result.palette : null;
    const dynamicStatus: DynamicStatus = !source
        ? 'idle'
        : result?.source !== source
            ? 'loading'
            : palette
                ? 'ready'
                : 'unavailable';

    useLayoutEffect(() => {
        const root = document.documentElement;

        root.dataset.theme = palette ? 'dynamic' : preferences.themeColor;

        if (palette) {
            root.style.setProperty('--dynamic-hue', String(palette.hue));
            root.style.setProperty('--dynamic-saturation', String(palette.saturation));
        } else {
            root.style.removeProperty('--dynamic-hue');
            root.style.removeProperty('--dynamic-saturation');
        }
    }, [preferences.themeColor, palette]);

    const value = useMemo(() => ({
        setPreview,
        dynamicStatus
    }), [dynamicStatus]);

    return (
        <ThemeContext.Provider value={value}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => {
    const context = useContext(ThemeContext);

    if (!context) {
        throw new Error('useTheme must be used within ThemeProvider');
    }

    return context;
};

export const useThemePreview = (preview: ThemePreview | null) => {
    const { setPreview } = useTheme();

    const enabled = preview !== null;
    const color = preview?.themeColor;
    const dynamic = preview?.themeFromWallpaper;
    const wallpaper = preview?.homeWallpaper;
    const wallpaperPreviewUrl = preview?.wallpaperPreviewUrl;

    useLayoutEffect(() => {
        if (!enabled) return;

        const override: ThemePreview = {};

        if (color !== undefined) {
            override.themeColor = color;
        }

        if (dynamic !== undefined) {
            override.themeFromWallpaper = dynamic;
        }

        if (wallpaper !== undefined) {
            override.homeWallpaper = wallpaper;
        }

        if (wallpaperPreviewUrl !== undefined) {
            override.wallpaperPreviewUrl = wallpaperPreviewUrl;
        }

        setPreview(override);

        return () => setPreview(null);
    }, [enabled, color, dynamic, wallpaper, wallpaperPreviewUrl, setPreview]);
};

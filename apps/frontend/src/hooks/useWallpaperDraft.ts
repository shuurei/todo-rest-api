import { useEffect, useRef, useState } from 'react';
import { homeWallpaperFields, type HomeWallpaperField, type UserPreferences } from '@nodus/shared';
import { getWallpaperUrl } from '@/utils/wallpaper';

type ImageDraft = { id: string | null; file: File | null; preview: string | null };
type Images = Record<HomeWallpaperField, ImageDraft>;
const fromPreferences = (preferences: Readonly<UserPreferences>) => Object.fromEntries(
    homeWallpaperFields.map((field) => [field, { id: preferences[field], file: null, preview: null }])
) as Images;

export function useWallpaperDraft(preferences: Readonly<UserPreferences>) {
    const [images, setImages] = useState(() => fromPreferences(preferences));
    const urls = useRef(new Set<string>());
    useEffect(() => {
        const allocated = urls.current;
        return () => { for (const url of allocated) URL.revokeObjectURL(url); };
    }, []);

    function release(url: string | null) {
        if (url) { URL.revokeObjectURL(url); urls.current.delete(url); }
    }
    function select(field: HomeWallpaperField, file: File) {
        release(images[field].preview);
        const preview = URL.createObjectURL(file);
        urls.current.add(preview);
        setImages((previous) => ({ ...previous, [field]: { ...previous[field], file, preview } }));
    }
    function remove(field: HomeWallpaperField) {
        release(images[field].preview);
        setImages((previous) => ({ ...previous, [field]: { id: null, file: null, preview: null } }));
    }
    function cancel(field: HomeWallpaperField) {
        release(images[field].preview);
        setImages((previous) => ({ ...previous, [field]: { ...previous[field], file: null, preview: null } }));
    }
    function reset(next: Readonly<UserPreferences>) {
        for (const url of urls.current) URL.revokeObjectURL(url);
        urls.current.clear();
        setImages(fromPreferences(next));
    }
    return {
        images, select, remove, cancel, reset,
        source: (field: HomeWallpaperField) => images[field].preview ?? getWallpaperUrl(images[field].id),
        values: Object.fromEntries(homeWallpaperFields.map((field) => [field, images[field].id])) as Pick<UserPreferences, HomeWallpaperField>,
        files: Object.fromEntries(homeWallpaperFields.map((field) => [field, images[field].file])) as Record<HomeWallpaperField, File | null>,
        dirty: homeWallpaperFields.some((field) => images[field].file || images[field].id !== preferences[field])
    };
}

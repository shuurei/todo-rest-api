export interface ImagePalette {
    hue: number;
    saturation: number;
}

const cache = new Map<string, Promise<ImagePalette | null>>();

const loadPalette = async (url: string): Promise<ImagePalette | null> => {
    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.referrerPolicy = 'no-referrer';
    image.src = url;

    let timeout: ReturnType<typeof setTimeout> | undefined;

    try {
        const [, { Vibrant }, { converter }] = await Promise.race([
            Promise.all([image.decode(), import('node-vibrant/browser'), import('culori')]),
            new Promise<never>((_, reject) => {
                timeout = setTimeout(() => reject(new Error('Image loading timed out')), 10000);
            })
        ]);

        let palette = await Vibrant.from(image).maxDimension(128).getPalette();
        if (!Object.values(palette).some((color) => color && color.population > 0)) {
            palette = await Vibrant.from(image).maxDimension(128).clearFilters().getPalette();
        }
        const swatch = Object.values(palette)
            .filter((color) => color !== null)
            .filter((color) => color.population > 0)
            .sort((left, right) => right.population - left.population)[0];
        const color = swatch ? converter('oklch')(swatch.hex) : null;
        if (!color) return null;

        const isNeutral = color.c < 0.005;
        return {
            hue: isNeutral ? 135 : color.h ?? 135,
            saturation: isNeutral ? 0 : Math.min(1.2, color.c / 0.14)
        };
    } catch {
        return null;
    } finally {
        clearTimeout(timeout);
        image.src = '';
    }
};

export const extractImagePalette = (url: string): Promise<ImagePalette | null> => {
    const cached = cache.get(url);
    if (cached) return cached;

    const result = loadPalette(url).then((palette) => {
        if (!palette && cache.get(url) === result) cache.delete(url);
        return palette;
    });

    if (cache.size >= 10) cache.delete(cache.keys().next().value!);
    cache.set(url, result);
    return result;
};

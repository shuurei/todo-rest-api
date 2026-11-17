export interface ImagePalette {
    hue: number;
    saturation: number;
}

const cache = new Map<string, Promise<ImagePalette | null>>();

const paletteFromPixels = (pixels: Uint8ClampedArray) => {
    const bins = new Map<number, {
        r: number;
        g: number;
        b: number;
        count: number;
        score: number;
    }>();

    let totalR = 0, totalG = 0, totalB = 0, total = 0;

    for (let i = 0; i < pixels.length; i += 4) {
        if ((pixels[i + 3] ?? 0) < 128) {
            continue;
        }

        const r = pixels[i]!, g = pixels[i + 1]!, b = pixels[i + 2]!;

        totalR += r;
        totalG += g;
        totalB += b;
        total += 1;

        const max = Math.max(r, g, b), min = Math.min(r, g, b);
        if (max < 20 || min > 240) {
            continue;
        }

        const key = ((r >> 5) << 6) | ((g >> 5) << 3) | (b >> 5);
        const bin = bins.get(key) ?? {
            r: 0,
            g: 0,
            b: 0,
            count: 0,
            score: 0
        };

        bin.r += r;
        bin.g += g;
        bin.b += b;
        bin.count += 1;
        bin.score += 0.15 + (max - min) / Math.max(max, 1);

        bins.set(key, bin);
    }

    const dominant = [...bins.values()].sort((a, b) => b.score - a.score)[0];
    const rgb = dominant
        ? [dominant.r / dominant.count, dominant.g / dominant.count, dominant.b / dominant.count]
        : [totalR / (total || 1), totalG / (total || 1), totalB / (total || 1)];

    const linear = rgb.map((value) => {
        const channel = value / 255;
        return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
    });

    const [r, g, b] = linear as [number, number, number];
    const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
    const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
    const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
    const a = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
    const labB = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;
    const chroma = Math.hypot(a, labB);

    return {
        hue: chroma < 0.005 ? 135 : ((Math.atan2(labB, a) * 180) / Math.PI + 360) % 360,
        saturation: chroma < 0.005 ? 0 : Math.min(1.2, chroma / 0.14)
    };
}

const loadPalette = async (url: string) => {
    try {
        return await new Promise<ImagePalette | null>((resolve) => {
            const image = new Image();

            let finished = false;

            const finish = (palette: ImagePalette | null) => {
                if (finished) {
                    return;
                }

                finished = true;

                window.clearTimeout(timeout);

                image.onload = null;
                image.onerror = null;

                if (!palette) {
                    image.src = '';
                }

                resolve(palette);
            };

            const timeout = window.setTimeout(() => finish(null), 10000);

            image.crossOrigin = 'anonymous';
            image.referrerPolicy = 'no-referrer';

            image.onload = () => {
                try {
                    const canvas = document.createElement('canvas');

                    canvas.width = 32;
                    canvas.height = 32;

                    const context = canvas.getContext('2d', {
                        willReadFrequently: true
                    });

                    if (!context || !image.naturalWidth || !image.naturalHeight) {
                        return finish(null);
                    }

                    context.drawImage(image, 0, 0, 32, 32);

                    finish(paletteFromPixels(context.getImageData(0, 0, 32, 32).data));
                } catch {
                    finish(null);
                }
            };

            image.onerror = () => finish(null);

            image.src = url;
        });
    } catch {
        return null;
    }
}

export const extractImagePalette = async (url: string) => {
    const cached = cache.get(url);
    if (cached) {
        return cached;
    }

    const result = loadPalette(url).then((palette) => {
        if (!palette) {
            cache.delete(url);
        }

        return palette;
    });

    if (cache.size >= 10) {
        cache.clear();
    }

    cache.set(url, result);

    return result;
}

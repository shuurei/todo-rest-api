export interface WeatherData {
    temperature: number;
    code: number;
}

const cache = new Map<string, {
    data: WeatherData;
    expiresAt: number;
}>();

export const weatherRefreshInterval = 10 * 60 * 1000;

const record = (value: unknown) => {
    return value !== null && typeof value === 'object' && !Array.isArray(value)
        ? (value as Record<string, unknown>)
        : {};
};

const fetchJson = async (url: URL, signal: AbortSignal) => {
    const response = await fetch(url, {
        signal: AbortSignal.any([signal, AbortSignal.timeout(10000)]),
        credentials: 'omit',
        referrerPolicy: 'no-referrer'
    });

    if (!response.ok) {
        throw new Error('Weather provider unavailable');
    }

    return await response.json();
};

export const searchWeatherLocations = async (query: string, language: string, signal: AbortSignal) => {
    const url = new URL('https://geocoding-api.open-meteo.com/v1/search');

    url.search = new URLSearchParams({
        name: query,
        count: '5',
        language: language.split('-')[0] || 'en',
        format: 'json'
    }).toString();

    const payload = record(await fetchJson(url, signal));

    if (payload.results === undefined) {
        return [];
    }

    if (!Array.isArray(payload.results)) {
        throw new Error('Invalid location response');
    }

    return payload.results.flatMap((value) => {
        const place = record(value);

        if (
            typeof place.name !== 'string' ||
            typeof place.latitude !== 'number' ||
            typeof place.longitude !== 'number' ||
            !Number.isFinite(place.latitude) ||
            !Number.isFinite(place.longitude) ||
            Math.abs(place.latitude) > 90 ||
            Math.abs(place.longitude) > 180
        ) {
            return [];
        }

        return [
            {
                name: [
                    ...new Set(
                        [place.name, place.admin1, place.country].filter(
                            (part): part is string => typeof part === 'string' && !!part
                        )
                    )
                ]
                    .join(', ')
                    .slice(0, 200),
                latitude: place.latitude,
                longitude: place.longitude
            }
        ];
    });
};

export const getWeather = async (latitude: number, longitude: number, signal: AbortSignal) => {
    const key = `${latitude},${longitude}`;
    const cached = cache.get(key);

    if (cached && cached.expiresAt > Date.now()) {
        return cached.data;
    }

    const url = new URL('https://api.open-meteo.com/v1/forecast');

    url.search = new URLSearchParams({
        latitude: String(latitude),
        longitude: String(longitude),
        current: 'temperature_2m,weather_code',
        temperature_unit: 'celsius',
        timezone: 'auto'
    }).toString();

    const current = record(record(await fetchJson(url, signal)).current);

    if (
        typeof current.temperature_2m !== 'number' ||
        !Number.isFinite(current.temperature_2m) ||
        typeof current.weather_code !== 'number' ||
        !Number.isInteger(current.weather_code)
    ) {
        throw new Error('Invalid weather response');
    }

    const data = {
        temperature: current.temperature_2m,
        code: current.weather_code
    };

    if (cache.size >= 30) {
        cache.clear();
    }

    cache.set(key, {
        data,
        expiresAt: Date.now() + weatherRefreshInterval
    });

    return data;
};

export const weatherCondition = (code: number) => {
    switch (code) {
        case 0: {
            return 'clear';
        }

        case 1: case 2: {
            return 'partlyCloudy';
        }

        case 3: {
            return 'cloudy';
        }

        case 45: case 48: {
            return 'fog';
        }

        case 51: case 53: case 55: case 56: case 57: {
            return 'drizzle';
        }

        case 61: case 63: case 65: case 66: case 67: case 80: case 81: case 82: {
            return 'rain';
        }

        case 71: case 73: case 75: case 77: case 85: case 86: {
            return 'snow';
        }

        case 95: case 96: case 99: {
            return 'storm';
        }

        default: {
            return 'unknown';
        }
    }
};

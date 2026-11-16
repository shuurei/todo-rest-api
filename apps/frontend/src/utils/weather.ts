export interface WeatherData {
    temperature: number;
    code: number;
}

const cache = new Map<
    string,
    {
        data: WeatherData;
        expiresAt: number;
    }
>();

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
    if (code === 0) {
        return 'clear';
    }

    if (code === 1 || code === 2) {
        return 'partlyCloudy';
    }

    if (code === 3) {
        return 'cloudy';
    }

    if (code === 45 || code === 48) {
        return 'fog';
    }

    if ([51, 53, 55, 56, 57].includes(code)) {
        return 'drizzle';
    }

    if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) {
        return 'rain';
    }

    if ([71, 73, 75, 77, 85, 86].includes(code)) {
        return 'snow';
    }

    if ([95, 96, 99].includes(code)) {
        return 'storm';
    }

    return 'unknown';
};

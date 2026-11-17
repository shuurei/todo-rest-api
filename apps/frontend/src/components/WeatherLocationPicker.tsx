import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { WeatherLocation } from '@todo/shared'
import TextInput from '@/components/common/TextInput'
import { searchWeatherLocations } from '@/utils/weather'

interface WeatherLocationPicker {
    value: WeatherLocation | null;
    onChange: (location: WeatherLocation | null) => void;
    disabled: boolean;
}

export default function WeatherLocationPicker({ value, onChange, disabled }: WeatherLocationPicker) {
    const { t, i18n } = useTranslation();

    const [query, setQuery] = useState('');
    const [results, setResults] = useState<WeatherLocation[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(false);
    const [searched, setSearched] = useState(false);

    const requestRef = useRef<AbortController | null>(null);

    useEffect(() => () => requestRef.current?.abort(), []);

    const search = async () => {
        if (query.trim().length < 2 || disabled || loading) return;

        requestRef.current?.abort();

        const controller = new AbortController();

        requestRef.current = controller;

        setLoading(true);
        setError(false);
        setSearched(false);
        setResults([]);

        try {
            const places = await searchWeatherLocations(query.trim(), i18n.resolvedLanguage || 'en', controller.signal);

            if (!controller.signal.aborted) {
                setResults(places);
                setSearched(true);
            }
        } catch {
            if (!controller.signal.aborted) {
                setError(true);
            }
        } finally {
            if (!controller.signal.aborted) {
                setLoading(false);
            }
        }
    }

    return (
        <div className='flex flex-col gap-3'>
            <TextInput
                id='weather-city'
                label={t('weather.city')}
                value={query}
                autoComplete="off"
                maxLength={100}
                placeholder={t('weather.cityPlaceholder')}
                disabled={disabled || loading}
                onChange={(event) => {
                    setQuery(event.target.value);
                    setResults([]);
                    setSearched(false);
                    setError(false);
                }}
                onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                        event.preventDefault();
                        search();
                    }
                }}
            />

            {value && (
                <div className='flex flex-wrap items-center justify-between gap-2 border border-theme-accent/30 p-3'>
                    <p className='min-w-0 text-xs text-theme-highlight'>
                        {t('weather.selectedCity', { name: value.name })}
                    </p>
                    <button
                        type='button'
                        disabled={disabled}
                        onClick={() => onChange(null)}
                        className='min-h-11 cursor-pointer text-xs text-theme-muted underline'
                    >
                        {t('common.delete')}
                    </button>
                </div>
            )}

            {results.length > 0 && (
                <ul aria-label={t('weather.cityResults')} className='flex flex-col gap-2'>
                    {results.map((place) => (
                        <li key={`${place.latitude},${place.longitude}`}>
                            <button
                                type='button'
                                disabled={disabled}
                                className='min-h-12 w-full cursor-pointer border border-theme-border/30 p-3 text-left text-sm text-theme-text hover:border-theme-accent'
                                onClick={() => {
                                    onChange(place);
                                    setResults([]);
                                    setSearched(false);
                                }}
                            >
                                {place.name}
                            </button>
                        </li>
                    ))}
                </ul>
            )}

            {searched && results.length === 0 && (
                <p role='status' className='text-xs text-theme-muted'>
                    {t('weather.noResults')}
                </p>
            )}

            {error && (
                <p role='alert' className='text-xs text-red-400'>
                    {t('weather.searchFailed')}
                </p>
            )}
        </div>
    );
}

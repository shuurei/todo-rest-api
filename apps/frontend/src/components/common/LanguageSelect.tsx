import { useId } from 'react'
import { useTranslation } from 'react-i18next'
import type { Language } from '@todo/shared'
import { isLanguage } from '@/i18n'

export default function LanguageSelect({ value, onChange }: {
    value: Language;
    onChange: (language: Language) => void;
}) {
    const id = useId();
    const { t } = useTranslation();
    return (
        <div className='flex flex-wrap items-center justify-between gap-3'>
            <label htmlFor={id} className='text-xs uppercase tracking-widest text-theme-muted'>{t('common.language')}</label>
            <select
                id={id}
                value={value}
                onChange={event => { if (isLanguage(event.target.value)) onChange(event.target.value); }}
                className='border border-theme-border/30 bg-theme-surface px-3 py-2 text-xs text-theme-text outline-none focus:border-theme-accent focus:ring-1 focus:ring-theme-accent/30'
            >
                <option value='fr' lang='fr'>Français</option>
                <option value='en' lang='en'>English</option>
            </select>
        </div>
    );
}

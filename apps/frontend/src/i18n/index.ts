import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import { supportedLanguages, type Language } from '@todo/shared'

import en from './en'
import fr from './fr'

export function isLanguage(value: unknown): value is Language {
    return supportedLanguages.some(language => language === value);
}

export function getGuestLanguage(): Language {
    try {
        const stored = localStorage.getItem('language');
        if (isLanguage(stored)) return stored;
    } catch { }
    return typeof navigator !== 'undefined' && navigator.language.toLowerCase().startsWith('en') ? 'en' : 'fr';
}

export function setGuestLanguage(language: Language) {
    try { localStorage.setItem('language', language); } catch { /* Optional persistence. */ }
    void i18n.changeLanguage(language);
}

void i18n.use(initReactI18next).init({
    resources: { en: { translation: en }, fr: { translation: fr } },
    lng: getGuestLanguage(),
    fallbackLng: 'en',
    supportedLngs: [...supportedLanguages],
    interpolation: { escapeValue: false },
    react: { useSuspense: false },
});

const updateDocumentLanguage = (language: string) => {
    if (typeof document !== 'undefined') document.documentElement.lang = language;
};

updateDocumentLanguage(i18n.language);

i18n.on('languageChanged', updateDocumentLanguage);

export function translateError(code: string): string {
    const key = Object.hasOwn(en.errors, code) ? code as keyof typeof en.errors : 'SERVER_ERROR';
    return i18n.t(`errors.${key}`);
}

export default i18n;

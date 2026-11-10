export const themeColors = ['green', 'blue', 'purple', 'amber', 'white', 'black'] as const;
export type ThemeColor = typeof themeColors[number];

export const supportedLanguages = ['fr', 'en'] as const;
export type Language = typeof supportedLanguages[number];

export interface UserPreferences {
    language: Language;
    themeColor: ThemeColor;
    /** Mini-app opening/closing duration, in seconds. Zero disables the animation. */
    transitionDuration: number;
}

export const defaultUserPreferences: Readonly<UserPreferences> = {
    language: 'fr',
    themeColor: 'green',
    transitionDuration: 2.2,
};

export const maxTransitionDuration = 5;

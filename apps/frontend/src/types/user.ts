import type { UserPreferences } from '@todo/shared'

export interface User {
    id: string;
    displayName: string | null;
    username: string;
    coins: number;
    flags: number;
    isDisabled: boolean;
    deletedAt: string | null;
    preferences: UserPreferences;
    createdAt: Date;
    updatedAt: Date;
}
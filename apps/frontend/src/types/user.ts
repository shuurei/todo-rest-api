import type { UserPreferences } from '@nodus/shared';

export interface User {
    id: string;
    displayName: string | null;
    username: string;
    flags: number;
    isDisabled: boolean;
    preferences: UserPreferences;
    createdAt: Date;
    updatedAt: Date;
}

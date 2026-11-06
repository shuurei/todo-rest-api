export interface User {
    id: string;
    displayName: string | null;
    username: string;
    coins: number;
    createdAt: Date;
    updatedAt: Date;
}
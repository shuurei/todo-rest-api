export interface User {
    id: string;
    displayName: string | null;
    username: string;
    email: string;
    coins: number;
    createdAt: Date;
    updatedAt: Date;
}
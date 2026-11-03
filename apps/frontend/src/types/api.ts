export interface ApiResponse<T> {
    data: T;
    code?: string;
    errors?: Record<string, string>;
}
export const getApiErrorCode = (error: unknown) => {
    const failure = error as {
        code?: string;
        errors?: Record<string, string>;
    } | null;

    return failure?.code ?? Object.values(failure?.errors ?? {})[0] ?? 'SERVER_ERROR';
}

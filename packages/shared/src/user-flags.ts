export const UserFlags = {
    ADMIN: 1 << 0
} as const;

export function hasFlag(flags: number, flag: number) {
    return (flags & flag) === flag;
}

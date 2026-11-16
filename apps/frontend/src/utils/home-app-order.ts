import type { HomeAppPath } from '@todo/shared';

export interface AppSlot {
    left: number;
    top: number;
    width: number;
    height: number;
}

export const findAppSlot = (slots: AppSlot[], x: number, y: number): number => {
    let nearest = -1;
    let distance = Infinity;

    for (const [index, { left, top, width, height }] of slots.entries()) {
        const next = (x - left - width / 2) ** 2 + (y - top - height / 2) ** 2;

        if (next < distance) {
            distance = next;

            nearest = index;
        }
    }

    return nearest;
};

export const reorderApp = (order: HomeAppPath[], path: HomeAppPath, slot: number, after: boolean): HomeAppPath[] => {
    const from = order.indexOf(path);

    if (from < 0 || slot < 0 || slot >= order.length || from === slot) {
        return order;
    }

    const next = order.filter((item) => item !== path);
    const target = slot - (from < slot ? 1 : 0) + (after ? 1 : 0);

    next.splice(target, 0, path);

    return next.every((item, index) => item === order[index]) ? order : next;
};

export const mergeAppOrder = (visible: HomeAppPath[], stored: HomeAppPath[]): HomeAppPath[] => [
    ...visible,
    ...stored.filter((path) => !visible.includes(path))
];

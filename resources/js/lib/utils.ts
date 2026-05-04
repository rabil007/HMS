import type { InertiaLinkProps } from '@inertiajs/react';
import { clsx } from 'clsx';
import type { ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function toUrl(url: NonNullable<InertiaLinkProps['href']>): string {
    return typeof url === 'string' ? url : url.url;
}

export function dateRangeFilterButtonLabel(
    from: string,
    to: string,
    options?: { allDates?: boolean; emptyLabel?: string },
): string {
    const emptyLabel = options?.emptyLabel ?? 'Date filter';

    if (options?.allDates) {
        return 'All dates';
    }

    const f = from.trim();
    const t = to.trim();

    if (!f && !t) {
        return emptyLabel;
    }

    if (f && t && f === t) {
        return f;
    }

    return `${f || '…'} → ${t || '…'}`;
}

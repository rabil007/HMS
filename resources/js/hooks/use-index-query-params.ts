import { router  } from '@inertiajs/react';
import type {InertiaLinkProps} from '@inertiajs/react';
import React from 'react';
import { toUrl } from '@/lib/utils';

export type IndexFilters = {
    q?: string;
    sort?: string;
    dir?: 'asc' | 'desc';
    per_page?: number;
};

export type UseIndexQueryParamsOptions = {
    href: NonNullable<InertiaLinkProps['href']>;
    filters?: IndexFilters;
    extras?: Record<string, string | number | undefined>;
    defaultPerPage?: number;
    debounceMs?: number;
};

export function useIndexQueryParams({
    href,
    filters,
    extras,
    defaultPerPage = 15,
    debounceMs = 250,
}: UseIndexQueryParamsOptions) {
    const [q, setQ] = React.useState(filters?.q ?? '');
    const [perPage, setPerPage] = React.useState<number>(filters?.per_page ?? defaultPerPage);
    const prevQRef = React.useRef(q);

    const url = React.useMemo(() => toUrl(href), [href]);

    const sort = filters?.sort || 'created_at';
    const dir: 'asc' | 'desc' = filters?.dir === 'asc' ? 'asc' : 'desc';

    const params = React.useMemo(
        () => ({
            q: q || undefined,
            sort: sort || undefined,
            dir: dir || undefined,
            per_page: perPage || undefined,
            ...(extras ?? {}),
        }),
        [q, sort, dir, perPage, extras],
    );

    const paramsKey = React.useMemo(() => JSON.stringify(params), [params]);

    React.useEffect(() => {
        const shouldDebounce = prevQRef.current !== q;
        prevQRef.current = q;

        if (!shouldDebounce || debounceMs <= 0) {
            router.get(url, params, { preserveScroll: true, preserveState: true, replace: true });

            return;
        }

        const t = setTimeout(() => {
            router.get(url, params, { preserveScroll: true, preserveState: true, replace: true });
        }, debounceMs);

        return () => clearTimeout(t);
    }, [q, perPage, url, debounceMs, paramsKey, params]);

    const toggleSort = React.useCallback(
        (nextSort: string) => {
            const nextDir = sort === nextSort ? (dir === 'asc' ? 'desc' : 'asc') : 'asc';
            router.get(
                url,
                { ...params, sort: nextSort, dir: nextDir },
                { preserveScroll: true, preserveState: true, replace: true },
            );
        },
        [url, params, sort, dir],
    );

    return {
        q,
        setQ,
        perPage,
        setPerPage,
        sort,
        dir,
        params,
        toggleSort,
    };
}


export function routeUrl(route: unknown): string {
    if (typeof route === 'string') {
        return route;
    }

    if (route && typeof route === 'object' && 'url' in route) {
        const url = (route as { url?: unknown }).url;

        if (typeof url === 'string') {
            return url;
        }
    }

    if (route && typeof (route as { toString?: unknown }).toString === 'function') {
        return (route as { toString: () => string }).toString();
    }

    return String(route);
}


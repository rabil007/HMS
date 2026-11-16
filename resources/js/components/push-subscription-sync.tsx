import { router } from '@inertiajs/react';
import { useEffect } from 'react';
import { syncPushSubscription } from '@/hooks/use-push-notifications';

type PageLike = { props?: { auth?: { user?: unknown } } };

/**
 * Keeps this device's push subscription in step with the server, once per
 * page load, as soon as a signed-in page is shown.
 */
export default function PushSubscriptionSync() {
    useEffect(() => {
        let done = false;

        const run = (page?: PageLike | null) => {
            if (done || !page?.props?.auth?.user) {
                return;
            }

            done = true;
            syncPushSubscription().catch(() => {
                done = false;
            });
        };

        const el = document.getElementById('app');

        try {
            run(el?.dataset?.page ? JSON.parse(el.dataset.page) : null);
        } catch {
            // Ignore an unreadable initial page.
        }

        return router.on('navigate', (event) => {
            run(event.detail.page as PageLike);
        });
    }, []);

    return null;
}

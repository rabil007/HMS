import { router } from '@inertiajs/react';
import { useEffect } from 'react';
import { toast } from 'sonner';

type Flash = {
    success?: string;
    error?: string;
    status?: string;
};

export default function AppToasts() {
    useEffect(() => {
        const show = (flash?: Flash) => {
            const f = (flash ?? {}) as Flash;

            if (f.success) {
                toast.success(f.success);
            }

            if (f.error) {
                toast.error(f.error);
            }

            if (f.status && !f.success && !f.error) {
                toast.message(f.status);
            }
        };

        const onSuccess = (event: any) => {
            const flash = event?.detail?.page?.props?.flash as Flash | undefined;
            show(flash);
        };

        const el = document.getElementById('app');
        const initialPage = el?.dataset?.page ? JSON.parse(el.dataset.page) : null;
        show(initialPage?.props?.flash as Flash | undefined);

        const unsubscribe = router.on('success', onSuccess);

        return () => {
            unsubscribe();
        };
    }, []);

    return null;
}


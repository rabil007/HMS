import { router, usePage } from '@inertiajs/react';
import React from 'react';
import AppNavbar from '@/components/app-navbar';
import { PageContainer } from '@/components/layout/page-container';
import { Skeleton } from '@/components/ui/skeleton';

export default function PageLayout({ children, title, backHref }: { children: React.ReactNode, title?: string, backHref?: string }) {
    const { url } = usePage();
    const [isNavigating, setIsNavigating] = React.useState(false);

    React.useEffect(() => {
        const onStart = () => setIsNavigating(true);
        const onFinish = () => setIsNavigating(false);
        const onError = () => setIsNavigating(false);

        const offStart = router.on('start', onStart);
        const offFinish = router.on('finish', onFinish);
        const offError = router.on('error', onError);

        return () => {
            offStart();
            offFinish();
            offError();
        };
    }, []);

    return (
        <div className="min-h-screen bg-background text-foreground font-sans">
            <AppNavbar title={title} backHref={backHref} />

            <main className="relative z-10 py-6 md:py-10">
                <PageContainer>
                    <div className="relative">
                        <div
                            key={url}
                            className={['page-transition-anim', isNavigating ? 'opacity-0' : ''].join(' ')}
                        >
                            {children}
                        </div>

                        {isNavigating && (
                            <div className="absolute inset-0 pointer-events-none">
                                <div className="space-y-4 p-0">
                                    <Skeleton className="h-6 w-1/3" />
                                    <Skeleton className="h-4 w-1/2" />
                                    <Skeleton className="h-4 w-full" />
                                    <Skeleton className="h-4 w-5/6" />
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
                                        <Skeleton className="h-24 w-full rounded-xl" />
                                        <Skeleton className="h-24 w-full rounded-xl" />
                                        <Skeleton className="h-24 w-full rounded-xl" />
                                        <Skeleton className="h-24 w-full rounded-xl" />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </PageContainer>
            </main>
        </div>
    );
}

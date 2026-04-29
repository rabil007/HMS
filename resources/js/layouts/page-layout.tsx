import { usePage } from '@inertiajs/react';
import React from 'react';
import AppNavbar from '@/components/app-navbar';
import { PageContainer } from '@/components/layout/page-container';

export default function PageLayout({ children, title, backHref }: { children: React.ReactNode, title?: string, backHref?: string }) {
    const { url } = usePage();
    const [entered, setEntered] = React.useState(false);

    React.useEffect(() => {
        setEntered(false);
        const frame = requestAnimationFrame(() => setEntered(true));

        return () => cancelAnimationFrame(frame);
    }, [url]);

    return (
        <div className="min-h-screen bg-background text-foreground font-sans">
            <AppNavbar title={title} backHref={backHref} />

            <main className="relative z-10 py-6 md:py-10">
                <PageContainer>
                    <div className={['page-transition', entered ? 'page-transition-entered' : ''].join(' ')}>
                        {children}
                    </div>
                </PageContainer>
            </main>
        </div>
    );
}

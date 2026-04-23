import React from 'react';
import AppNavbar from '@/components/app-navbar';

export default function PageLayout({ children, title, backHref }: { children: React.ReactNode, title?: string, backHref?: string }) {
    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-[#0B0F19] text-foreground font-sans">
            <AppNavbar title={title} backHref={backHref} />

            <main className="mx-auto max-w-[1200px] p-6 md:p-10 relative z-10">
                {children}
            </main>
        </div>
    );
}

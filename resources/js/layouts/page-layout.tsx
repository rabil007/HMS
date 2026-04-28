import React from 'react';
import AppNavbar from '@/components/app-navbar';
import { PageContainer } from '@/components/layout/page-container';

export default function PageLayout({ children, title, backHref }: { children: React.ReactNode, title?: string, backHref?: string }) {
    return (
        <div className="min-h-screen bg-background text-foreground font-sans">
            <AppNavbar title={title} backHref={backHref} />

            <main className="relative z-10 py-6 md:py-10">
                <PageContainer>{children}</PageContainer>
            </main>
        </div>
    );
}

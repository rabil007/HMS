import { createInertiaApp } from '@inertiajs/react';
import { Toaster } from 'sonner';
import AppToasts from '@/components/app-toasts';
import { TooltipProvider } from '@/components/ui/tooltip';
import { initializeTheme } from '@/hooks/use-appearance';
import AuthLayout from '@/layouts/auth-layout';
import SettingsLayout from '@/layouts/settings/layout';

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

createInertiaApp({
    title: (title) => (title ? `${title} - ${appName}` : appName),
    layout: (name) => {
        switch (true) {
            case name.startsWith('auth/'):
                return AuthLayout;
            case name.startsWith('settings/'):
                return SettingsLayout;
            default:
                return null;
        }
    },
    strictMode: true,
    withApp(app) {
        return (
            <TooltipProvider delayDuration={0}>
                {app}
                <AppToasts />
                <Toaster
                    position="top-right"
                    theme="system"
                    toastOptions={{
                        classNames: {
                            toast: 'border border-border bg-background text-foreground shadow-lg',
                            description: 'text-muted-foreground',
                            actionButton:
                                'bg-primary text-primary-foreground hover:bg-primary/90',
                            cancelButton:
                                'bg-muted text-foreground hover:bg-muted/80',
                        },
                    }}
                />
            </TooltipProvider>
        );
    },
    progress: {
        color: 'var(--muted-foreground)',
        delay: 0,
        showSpinner: false,
        includeCSS: true,
    },
});

// This will set light / dark mode on load...
initializeTheme();

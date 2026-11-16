import { Link, usePage } from '@inertiajs/react';
import type { PropsWithChildren } from 'react';
import Heading from '@/components/heading';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useCurrentUrl } from '@/hooks/use-current-url';
import PageLayout from '@/layouts/page-layout';
import { cn, toUrl } from '@/lib/utils';
import { dashboard } from '@/routes';
import { edit as editAppearance } from '@/routes/appearance';
import { edit } from '@/routes/profile';
import { edit as editSecurity } from '@/routes/security';
import type { NavItem } from '@/types';

const sidebarNavItems: (NavItem & { adminOnly?: boolean })[] = [
    {
        title: 'Profile',
        href: edit(),
        icon: null,
    },
    {
        title: 'Notifications',
        href: '/settings/notifications',
        icon: null,
    },
    {
        title: 'Email',
        href: '/settings/email',
        icon: null,
        adminOnly: true,
    },
    {
        title: 'Security',
        href: editSecurity(),
        icon: null,
    },
    {
        title: 'Appearance',
        href: editAppearance(),
        icon: null,
    },
];

export default function SettingsLayout({ children }: PropsWithChildren) {
    const { isCurrentOrParentUrl } = useCurrentUrl();
    const isAdmin =
        (usePage().props as { auth?: { user?: { role?: string } } }).auth?.user
            ?.role === 'admin';
    const navItems = sidebarNavItems.filter(
        (item) => !item.adminOnly || isAdmin,
    );

    return (
        <PageLayout title="Settings" backHref={toUrl(dashboard())}>
            <div className="rounded-3xl border border-border bg-card/50 px-4 py-6 shadow-sm backdrop-blur-sm">
                <Heading
                    title="Account Settings"
                    description="Manage your profile and account settings"
                />

                <div className="mt-8 flex flex-col lg:flex-row lg:space-x-12">
                    <aside className="w-full max-w-xl lg:w-48">
                        <nav
                            className="flex gap-1 overflow-x-auto lg:flex-col lg:space-y-1"
                            aria-label="Settings"
                        >
                            {navItems.map((item, index) => (
                                <Button
                                    key={`${toUrl(item.href)}-${index}`}
                                    size="sm"
                                    variant="ghost"
                                    asChild
                                    className={cn(
                                        'h-10 shrink-0 justify-start rounded-xl lg:w-full',
                                        {
                                            'bg-primary/10 text-primary hover:bg-primary/20 hover:text-primary':
                                                isCurrentOrParentUrl(item.href),
                                        },
                                    )}
                                >
                                    <Link href={toUrl(item.href)}>
                                        {item.icon && (
                                            <item.icon className="h-4 w-4" />
                                        )}
                                        {item.title}
                                    </Link>
                                </Button>
                            ))}
                        </nav>
                    </aside>

                    <Separator className="my-6 lg:hidden" />

                    <div className="flex-1 md:max-w-2xl">
                        <section className="max-w-xl space-y-12">
                            {children}
                        </section>
                    </div>
                </div>
            </div>
        </PageLayout>
    );
}

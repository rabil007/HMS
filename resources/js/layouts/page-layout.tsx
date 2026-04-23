import { Link, usePage } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import React from 'react';
import AppLogoIcon from '@/components/app-logo-icon';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { UserMenuContent } from '@/components/user-menu-content';
import { useInitials } from '@/hooks/use-initials';
import { routeUrl } from '@/lib/route-url';
import { dashboard } from '@/routes';

export default function PageLayout({ children, title, backHref }: { children: React.ReactNode, title?: string, backHref?: string }) {
    const { auth } = usePage().props as any;
    const getInitials = useInitials();
    const user = auth.user as any;

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-[#0B0F19] text-foreground font-sans">
            {/* Minimal Top Bar */}
            <header className="sticky top-0 z-40 w-full border-b border-border/50 bg-background/80 backdrop-blur-xl">
                <div className="flex h-16 items-center justify-between px-6 max-w-[1200px] mx-auto">
                    <div className="flex items-center gap-4">
                        {backHref && (
                            <Link href={backHref} className="mr-3 text-muted-foreground hover:text-foreground transition rounded-full hover:bg-muted p-2">
                                <ArrowLeft className="size-5" />
                            </Link>
                        )}
                        <Link href={routeUrl(dashboard())} className="flex items-center gap-3 outline-none">
                            <AppLogoIcon className="h-9 w-auto" />
                        </Link>
                        {title && (
                            <>
                                <div className="h-5 w-px bg-border mx-2 hidden sm:block" />
                                <h1 className="text-[15px] font-medium hidden sm:block text-zinc-600 dark:text-zinc-300 tracking-wide">{title}</h1>
                            </>
                        )}
                    </div>
                    
                    <div className="flex items-center gap-4">
                        <DropdownMenu>
                            <DropdownMenuTrigger className="focus:outline-none flex items-center gap-2 rounded-full hover:bg-muted transition p-1 cursor-pointer border border-transparent hover:border-border">
                                <Avatar className="h-8 w-8 shadow-sm">
                                    <AvatarImage src={user.avatar} alt={user.name} />
                                    <AvatarFallback className="bg-primary/90 text-primary-foreground text-xs font-semibold">
                                        {getInitials(user.name)}
                                    </AvatarFallback>
                                </Avatar>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56 mt-2 rounded-xl shadow-2xl">
                                <UserMenuContent user={user} />
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>
            </header>

            <main className="mx-auto max-w-[1200px] p-6 md:p-10 relative z-10">
                {children}
            </main>
        </div>
    );
}

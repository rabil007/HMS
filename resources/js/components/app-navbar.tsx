import { Link, router, usePage } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import { useEffect, useState } from 'react';
import AppLogoIcon from '@/components/app-logo-icon';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { UserMenuContent } from '@/components/user-menu-content';
import { useInitials } from '@/hooks/use-initials';
import { toUrl } from '@/lib/utils';
import { dashboard } from '@/routes';

export default function AppNavbar({
    title,
    backHref,
    showClock = true,
}: {
    title?: string;
    backHref?: string;
    showClock?: boolean;
}) {
    const { auth } = usePage().props as any;
    const getInitials = useInitials();
    const user = auth.user as any;

    const [now, setNow] = useState<Date | null>(null);
    useEffect(() => {
        if (!showClock) {
            return;
        }

        queueMicrotask(() => {
            setNow(new Date());
        });
        const timer = setInterval(() => setNow(new Date()), 1000);

        return () => clearInterval(timer);
    }, [showClock]);

    const timeString = now ? now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '--:--:--';
    const dateString = now ? now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) : '—';
    const useHistoryBack = backHref === '__history__';

    return (
        <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/60 backdrop-blur supports-[backdrop-filter]:bg-background/40">
            <div className="flex h-16 items-center justify-between px-5 sm:px-8 max-w-[1200px] mx-auto">
                <div className="flex items-center gap-3 min-w-0">
                    {backHref && (
                        useHistoryBack ? (
                            <button
                                type="button"
                                onClick={() => {
                                    if (typeof window !== 'undefined' && window.history.length > 1) {
                                        window.history.back();

                                        return;
                                    }

                                    router.visit(toUrl(dashboard()));
                                }}
                                className="text-muted-foreground hover:text-foreground transition rounded-full hover:bg-muted p-2"
                            >
                                <ArrowLeft className="size-5" />
                            </button>
                        ) : (
                            <Link
                                href={toUrl(backHref)}
                                className="text-muted-foreground hover:text-foreground transition rounded-full hover:bg-muted p-2"
                            >
                                <ArrowLeft className="size-5" />
                            </Link>
                        )
                    )}

                    <Link href={toUrl(dashboard())} className="select-none shrink-0">
                        <AppLogoIcon className="h-9 w-auto" />
                    </Link>

                    {title && (
                        <>
                            <div className="h-5 w-px bg-border mx-1 hidden sm:block" />
                            <h1 className="text-[15px] font-medium hidden sm:block text-muted-foreground tracking-wide truncate">
                                {title}
                            </h1>
                        </>
                    )}
                </div>

                {showClock && (
                    <div className="hidden sm:flex flex-col items-center">
                        <span className="font-mono text-[15px] font-semibold tracking-widest tabular-nums text-foreground" suppressHydrationWarning>
                            {timeString}
                        </span>
                        <span className="text-[10px] text-muted-foreground tracking-wider uppercase" suppressHydrationWarning>
                            {dateString}
                        </span>
                    </div>
                )}

                <DropdownMenu>
                    <DropdownMenuTrigger className="focus:outline-none flex items-center gap-2.5 rounded-full px-2 py-1.5 hover:bg-muted/50 border border-transparent hover:border-border/60 transition-all cursor-pointer">
                        <span className="text-[13px] font-medium text-muted-foreground hidden sm:block">
                            {user.name}
                        </span>
                        <Avatar className="h-8 w-8 border border-border/60">
                            <AvatarImage src={user.avatar} alt={user.name} />
                            <AvatarFallback className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white font-bold text-xs">
                                {getInitials(user.name)}
                            </AvatarFallback>
                        </Avatar>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                        align="end"
                        className="w-56 mt-2 rounded-xl shadow-2xl border border-border/60 bg-background/95 backdrop-blur-md"
                    >
                        <UserMenuContent user={user} />
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </header>
    );
}


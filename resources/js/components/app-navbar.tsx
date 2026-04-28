import { Link, router, usePage } from '@inertiajs/react';
import { ArrowLeft, Bell, Check, CheckCircle2, Clock, XCircle } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import AppLogoIcon from '@/components/app-logo-icon';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { UserMenuContent } from '@/components/user-menu-content';
import { useInitials } from '@/hooks/use-initials';
import { toUrl } from '@/lib/utils';
import { dashboard } from '@/routes';

type AppNotification = {
    id: string;
    read_at: string | null;
    created_at: string | null;
    data: {
        title?: string;
        body?: string;
        url?: string;
        type?: string;
    };
};

function typeIcon(type: string | undefined) {
    const t = String(type ?? '');

    if (t === 'booking_approved') {
        return { Icon: CheckCircle2, cls: 'text-success' };
    }

    if (t === 'booking_rejected') {
        return { Icon: XCircle, cls: 'text-destructive' };
    }

    if (t === 'booking_requested') {
        return { Icon: Clock, cls: 'text-warning' };
    }

    return { Icon: Bell, cls: 'text-muted-foreground' };
}

function csrfToken(): string | null {
    if (typeof document === 'undefined') {
        return null;
    }

    const meta = document.querySelector('meta[name="csrf-token"]');

    return meta?.getAttribute('content') ?? null;
}

function normalizeInternalUrl(url: string): string {
    try {
        if (url.startsWith('http://') || url.startsWith('https://')) {
            const u = new URL(url);

            return `${u.pathname}${u.search}${u.hash}`;
        }
    } catch {
        void 0;
    }

    return url;
}

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

    const [notificationsOpen, setNotificationsOpen] = useState(false);
    const [unread, setUnread] = useState<number>(0);
    const [notifications, setNotifications] = useState<AppNotification[]>([]);
    const [loadingNotifications, setLoadingNotifications] = useState(false);

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

    const fetchUnread = async () => {
        try {
            const res = await fetch('/notifications/unread-count', {
                headers: { Accept: 'application/json' },
                credentials: 'same-origin',
            });

            if (!res.ok) {
                return;
            }

            const json = (await res.json()) as { unread?: number };
            setUnread(Number(json.unread ?? 0));
        } catch {
            void 0;
        }
    };

    const fetchNotifications = async () => {
        setLoadingNotifications(true);

        try {
            const res = await fetch('/notifications', {
                headers: { Accept: 'application/json' },
                credentials: 'same-origin',
            });

            if (!res.ok) {
                return;
            }

            const json = (await res.json()) as { notifications?: AppNotification[] };
            setNotifications(Array.isArray(json.notifications) ? json.notifications : []);
        } catch {
            void 0;
        } finally {
            setLoadingNotifications(false);
        }
    };

    const postJson = async (url: string) => {
        const token = csrfToken();
        await fetch(url, {
            method: 'POST',
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
                ...(token ? { 'X-CSRF-TOKEN': token } : {}),
            },
            credentials: 'same-origin',
            body: JSON.stringify({}),
        });
    };

    useEffect(() => {
        queueMicrotask(() => {
            void fetchUnread();
        });

        const onVisibility = () => {
            if (document.visibilityState === 'visible') {
                queueMicrotask(() => {
                    void fetchUnread();
                });
            }
        };

        document.addEventListener('visibilitychange', onVisibility);

        const timer = window.setInterval(() => {
            if (document.visibilityState !== 'visible') {
                return;
            }

            queueMicrotask(() => {
                void fetchUnread();
            });
        }, 25000);

        return () => {
            document.removeEventListener('visibilitychange', onVisibility);
            window.clearInterval(timer);
        };
         
    }, []);

    useEffect(() => {
        if (notificationsOpen) {
            queueMicrotask(() => {
                void fetchNotifications();
            });
        }
         
    }, [notificationsOpen]);

    const prettyTime = useMemo(() => {
        return (iso: string | null) => {
            if (!iso) {
                return '';
            }

            const d = new Date(iso);

            return d.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
        };
    }, []);

    return (
        <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/60 backdrop-blur supports-backdrop-filter:bg-background/40">
            <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 sm:px-8">
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

                <div className="flex items-center gap-2">
                    <DropdownMenu open={notificationsOpen} onOpenChange={setNotificationsOpen}>
                        <DropdownMenuTrigger className="relative rounded-full border border-transparent p-2 text-muted-foreground transition hover:bg-muted/50 hover:text-foreground hover:border-border/60 focus:outline-none">
                            <Bell className="size-5" />
                            {unread > 0 && (
                                <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1.5 text-[11px] font-black text-white shadow-[0_6px_18px_rgba(0,0,0,0.35)]">
                                    {unread}
                                </span>
                            )}
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                            align="end"
                            className="mt-2 w-[360px] rounded-xl border border-border/60 bg-background/95 p-2 shadow-2xl backdrop-blur-md"
                        >
                            <div className="flex items-center justify-between px-2 py-2">
                                <div className="text-sm font-bold text-foreground">
                                    Notifications
                                </div>
                                <div className="flex items-center gap-3">
                                    <button
                                        type="button"
                                        onClick={async () => {
                                            await postJson('/notifications/read-all');
                                            await fetchUnread();
                                            await fetchNotifications();
                                        }}
                                        className="text-xs font-bold text-primary hover:text-primary/80"
                                    >
                                        Mark all read
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setNotificationsOpen(false);
                                            router.visit('/notifications-center');
                                        }}
                                        className="text-xs font-bold text-muted-foreground hover:text-foreground"
                                    >
                                        View all
                                    </button>
                                </div>
                            </div>

                            <DropdownMenuSeparator />

                            <div className="max-h-[360px] overflow-auto py-1">
                                {loadingNotifications ? (
                                    <div className="px-3 py-10 text-center text-sm font-semibold text-muted-foreground">
                                        Loading…
                                    </div>
                                ) : notifications.length === 0 ? (
                                    <div className="px-3 py-10 text-center text-sm font-semibold text-muted-foreground">
                                        No notifications
                                    </div>
                                ) : (
                                    <div className="grid gap-1">
                                        {notifications.map((n) => {
                                            const isUnread = !n.read_at;
                                            const url = n.data?.url;

                                            return (
                                                <button
                                                    key={n.id}
                                                    type="button"
                                                    onClick={async () => {
                                                        if (isUnread) {
                                                            await postJson(`/notifications/${n.id}/read`);
                                                        }

                                                        await fetchUnread();

                                                        if (url) {
                                                            router.visit(
                                                                normalizeInternalUrl(
                                                                    toUrl(url),
                                                                ),
                                                            );
                                                        }

                                                        setNotificationsOpen(false);
                                                    }}
                                                    className={[
                                                        'w-full rounded-lg border border-transparent px-3 py-2 text-left transition hover:bg-muted/60',
                                                        isUnread ? 'bg-muted/30' : '',
                                                    ].join(' ')}
                                                >
                                                    <div className="flex items-start justify-between gap-3">
                                                        <div className="flex min-w-0 gap-2">
                                                            {(() => {
                                                                const { Icon, cls } = typeIcon(n.data?.type);

                                                                return (
                                                                    <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted/40">
                                                                        <Icon className={['size-4', cls].join(' ')} />
                                                                    </span>
                                                                );
                                                            })()}
                                                            <div className="min-w-0">
                                                                <div className="truncate text-sm font-bold text-foreground">
                                                                    {n.data?.title ?? 'Notification'}
                                                                </div>
                                                                <div className="truncate text-[12px] font-semibold text-muted-foreground">
                                                                    {n.data?.body ?? ''}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="shrink-0 text-right">
                                                            {isUnread && (
                                                                <div className="inline-flex items-center gap-1 text-[11px] font-black text-success">
                                                                    <Check className="size-3.5" />
                                                                    New
                                                                </div>
                                                            )}
                                                            <div className="mt-1 text-[11px] font-semibold text-muted-foreground">
                                                                {prettyTime(n.created_at)}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    <DropdownMenu>
                    <DropdownMenuTrigger className="focus:outline-none flex items-center gap-2.5 rounded-full px-2 py-1.5 hover:bg-muted/50 border border-transparent hover:border-border/60 transition-all cursor-pointer">
                        <span className="text-[13px] font-medium text-muted-foreground hidden sm:block">
                            {user.name}
                        </span>
                        <Avatar className="h-8 w-8 border border-border/60">
                            <AvatarImage src={user.avatar} alt={user.name} />
                            <AvatarFallback className="bg-primary text-primary-foreground font-bold text-xs">
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
            </div>
        </header>
    );
}


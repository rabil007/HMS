import { Head, Link, router } from '@inertiajs/react';
import {
    Bell,
    Check,
    CheckCircle2,
    Clock,
    ExternalLink,
    XCircle,
} from 'lucide-react';
import React from 'react';
import PageLayout from '@/layouts/page-layout';
import { toUrl } from '@/lib/utils';
import { dashboard } from '@/routes';

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

async function postJson(url: string): Promise<void> {
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
}

type NotificationRow = {
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

type Paged<T> = {
    data: T[];
    links: { url: string | null; label: string; active: boolean }[];
    meta: { current_page: number; last_page: number; per_page: number; total: number };
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

export default function NotificationsIndex({
    notifications,
    unread,
}: {
    notifications: Paged<NotificationRow>;
    unread: number;
}) {
    return (
        <PageLayout title="Notifications" backHref={toUrl(dashboard())}>
            <Head title="Notifications" />

            <div className="mx-auto max-w-6xl space-y-6 pb-10">
                <div className="rounded-4xl border border-border/50 bg-card/40 backdrop-blur-xl p-6 shadow-lg">
                    <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-border/50 bg-background/30">
                                <Bell className="size-6 text-primary" />
                            </div>
                            <div>
                                <div className="text-sm font-semibold text-muted-foreground">
                                    Unread
                                </div>
                                <div className="text-2xl font-black text-foreground">
                                    {unread}
                                </div>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={async () => {
                                await postJson('/notifications/read-all');
                                router.reload();
                            }}
                            className="inline-flex items-center gap-2 rounded-xl border border-border/60 bg-background/50 px-4 py-2 text-sm font-bold text-foreground transition-colors hover:bg-muted"
                        >
                            <Check className="size-4 text-success" />
                            Mark all read
                        </button>
                    </div>
                </div>

                <div className="rounded-4xl border border-border/50 bg-card/40 backdrop-blur-xl p-2 shadow-lg">
                    {notifications.data.length === 0 ? (
                        <div className="p-10 text-center text-sm font-semibold text-muted-foreground">
                            No notifications
                        </div>
                    ) : (
                        <div className="grid gap-1">
                            {notifications.data.map((n) => (
                                <button
                                    key={n.id}
                                    type="button"
                                    onClick={async () => {
                                        if (!n.read_at) {
                                            await postJson(
                                                `/notifications/${n.id}/read`,
                                            );
                                            router.reload();
                                        }

                                        if (n.data?.url) {
                                            router.visit(
                                                normalizeInternalUrl(
                                                    toUrl(n.data.url),
                                                ),
                                            );
                                        }
                                    }}
                                    className={[
                                        'w-full rounded-3xl border border-transparent px-4 py-3 text-left transition hover:bg-muted/50',
                                        !n.read_at ? 'bg-muted/25' : '',
                                    ].join(' ')}
                                >
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex min-w-0 gap-3">
                                            {(() => {
                                                const { Icon, cls } = typeIcon(n.data?.type);

                                                return (
                                                    <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border/50 bg-background/30">
                                                        <Icon className={['size-5', cls].join(' ')} />
                                                    </span>
                                                );
                                            })()}
                                            <div className="min-w-0">
                                                <div className="truncate text-sm font-black text-foreground">
                                                    {n.data?.title ?? 'Notification'}
                                                </div>
                                                <div className="truncate text-[12px] font-semibold text-muted-foreground">
                                                    {n.data?.body ?? ''}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="shrink-0 text-right">
                                            <div className="inline-flex items-center gap-1 text-[12px] font-bold text-primary">
                                                Open <ExternalLink className="size-3.5" />
                                            </div>
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}

                    {notifications.links?.length > 0 && (
                        <div className="flex flex-wrap items-center justify-center gap-1 p-3">
                            {notifications.links.map((l, idx) => (
                                <Link
                                    key={idx}
                                    href={l.url ?? '#'}
                                    preserveScroll
                                    className={[
                                        'rounded-lg px-3 py-1.5 text-sm font-bold',
                                        l.active
                                            ? 'bg-primary text-primary-foreground'
                                            : 'text-muted-foreground hover:bg-muted',
                                        !l.url ? 'pointer-events-none opacity-50' : '',
                                    ].join(' ')}
                                    dangerouslySetInnerHTML={{ __html: l.label }}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </PageLayout>
    );
}

NotificationsIndex.layout = (page: React.ReactNode) => page;


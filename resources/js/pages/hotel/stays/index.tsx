import { Head, Link, router } from '@inertiajs/react';
import { ArrowRight, Bed, CalendarCheck, Clock, Eye, Hash } from 'lucide-react';
import React, { useMemo, useState } from 'react';
import { GlassCard } from '@/components/layout/glass-card';
import { ListSearch } from '@/components/list/list-search';
import { PaginationBar } from '@/components/list/pagination-bar';
import { RowsPerPageSelect } from '@/components/list/rows-per-page-select';
import { Badge } from '@/components/ui/badge';
import { useIndexQueryParams } from '@/hooks/use-index-query-params';
import PageLayout from '@/layouts/page-layout';
import { cn, toUrl } from '@/lib/utils';
import { dashboard } from '@/routes';
import { index as staysIndex, show as staysShow } from '@/routes/hotel/stays';

type Paged<T> = {
    data: T[];
    links: { url: string | null; label: string; active: boolean }[];
    meta: { current_page: number; last_page: number; per_page: number; total: number };
};

type BookingRow = {
    id: number;
    public_id: string;
    status: string;
    check_in_date: string;
    check_out_date: string | null;
    actual_check_in_date?: string | null;
    actual_check_out_date?: string | null;
    guest_check_in?: string | null;
    guest_check_out?: string | null;
    guest_name: string | null;
    guest_email: string | null;
    guest_phone: string | null;
    single_or_twin: string | null;
    confirmation_number: string | null;
    client?: { id: number; name: string } | null;
};

function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

export default function HotelStaysIndex({
    bookings,
    filters,
    counts,
}: {
    bookings: Paged<BookingRow>;
    filters: { q?: string; tab?: string; per_page?: number; column?: Record<string, string> };
    counts: { total: number; to_checkin: number; in_house: number; checked_out: number };
}) {
    const initialTab = (filters.tab === 'in_house' || filters.tab === 'checked_out') ? filters.tab : 'to_checkin';
    const [tab, setTab] = useState<'to_checkin' | 'in_house' | 'checked_out'>(initialTab as any);

    const extras = useMemo(
        () => ({
            tab,
        }),
        [tab],
    );

    const { q, setQ, perPage, setPerPage } = useIndexQueryParams({
        href: staysIndex(),
        filters,
        defaultPerPage: 15,
        extras,
    });

    const statusPill = (b: BookingRow) => {
        if (b.guest_check_out) {
            return { label: 'Checked out', cls: 'bg-muted/50 text-muted-foreground border-border/40' };
        }

        if (b.guest_check_in) {
            return { label: 'In-house', cls: 'bg-info/15 text-info border-info/20' };
        }

        return { label: 'To check-in', cls: 'bg-warning/15 text-warning border-warning/20' };
    };

    return (
        <PageLayout title="Check-in / Check-out" backHref={toUrl(dashboard())}>
            <Head title="Check-in / Check-out" />

                <div className="mx-auto max-w-4xl space-y-8 pb-10">
                <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-info/10">
                        <CalendarCheck className="size-6 text-info" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight text-foreground">Check-in / Check-out</h2>
                        <p className="text-muted-foreground text-sm">Verify confirmation and manage guest stays.</p>
                    </div>
                </div>

                <div className="min-w-0 w-full">
                    <ListSearch value={q} onChange={setQ} placeholder="Search guest, email, phone, agency, confirmation…" />
                </div>

                <div className="grid w-full min-w-0 grid-cols-3 gap-1 rounded-2xl border border-border/40 bg-muted/40 p-1 sm:gap-1.5 sm:p-1.5">
                    <button
                        type="button"
                        onClick={() => setTab('to_checkin')}
                        className={cn(
                            'flex min-h-11 min-w-0 flex-col items-center justify-center gap-0.5 rounded-xl px-1 py-2 text-center text-[11px] font-bold leading-tight transition-all sm:min-h-0 sm:flex-row sm:gap-2 sm:px-3 sm:py-2 sm:text-[13px]',
                            tab === 'to_checkin' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground',
                        )}
                    >
                        <span className="max-w-full wrap-break-word">To check-in</span>
                        <Badge
                            className={cn(
                                'shrink-0 px-1.5 text-[10px] sm:px-2 sm:text-xs',
                                tab === 'to_checkin' ? 'bg-warning/20 text-warning' : 'bg-muted-foreground/20 text-muted-foreground',
                                'hover:bg-transparent',
                            )}
                        >
                            {counts.to_checkin}
                        </Badge>
                    </button>
                    <button
                        type="button"
                        onClick={() => setTab('in_house')}
                        className={cn(
                            'flex min-h-11 min-w-0 flex-col items-center justify-center gap-0.5 rounded-xl px-1 py-2 text-center text-[11px] font-bold leading-tight transition-all sm:min-h-0 sm:flex-row sm:gap-2 sm:px-3 sm:py-2 sm:text-[13px]',
                            tab === 'in_house' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground',
                        )}
                    >
                        <span className="max-w-full wrap-break-word">In-house</span>
                        <Badge
                            className={cn(
                                'shrink-0 px-1.5 text-[10px] sm:px-2 sm:text-xs',
                                tab === 'in_house' ? 'bg-info/20 text-info' : 'bg-muted-foreground/20 text-muted-foreground',
                                'hover:bg-transparent',
                            )}
                        >
                            {counts.in_house}
                        </Badge>
                    </button>
                    <button
                        type="button"
                        onClick={() => setTab('checked_out')}
                        className={cn(
                            'flex min-h-11 min-w-0 flex-col items-center justify-center gap-0.5 rounded-xl px-1 py-2 text-center text-[11px] font-bold leading-tight transition-all sm:min-h-0 sm:flex-row sm:gap-2 sm:px-3 sm:py-2 sm:text-[13px]',
                            tab === 'checked_out' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground',
                        )}
                    >
                        <span className="max-w-full wrap-break-word">Checked out</span>
                        <Badge
                            className={cn(
                                'shrink-0 px-1.5 text-[10px] sm:px-2 sm:text-xs',
                                tab === 'checked_out' ? 'bg-success/20 text-success' : 'bg-muted-foreground/20 text-muted-foreground',
                                'hover:bg-transparent',
                            )}
                        >
                            {counts.checked_out}
                        </Badge>
                    </button>
                </div>

                <GlassCard as="section" className="flex min-h-128 flex-col overflow-hidden">
                    <div className="flex-1 bg-background/20 p-4 sm:p-6">
                        {bookings.data.length === 0 ? (
                            <div className="flex h-full flex-col items-center justify-center py-20 text-center opacity-60">
                                <Bed className="mb-3 size-12 text-muted-foreground" />
                                <p className="text-sm font-medium">No records found.</p>
                                <p className="mt-1 text-xs text-muted-foreground">Try a different search or tab.</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {bookings.data.map((b) => {
                                    const pill = statusPill(b);

                                    return (
                                        <div
                                            key={b.id}
                                            onClick={() => router.get(toUrl(staysShow({ booking: b.id })))}
                                            className="group flex cursor-pointer flex-col rounded-2xl border border-border/40 bg-card p-4 shadow-sm transition-all hover:bg-muted/30 sm:p-5"
                                        >
                                            <div className="min-w-0 group/title">
                                                <div className="flex flex-wrap items-center gap-2 text-base font-bold text-foreground transition-colors group-hover/title:text-primary">
                                                    <span className="min-w-0 truncate">{b.guest_name ?? 'Guest'}</span>
                                                    <Badge variant="outline" className={cn('shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide', pill.cls)}>
                                                        {pill.label}
                                                    </Badge>
                                                    {b.single_or_twin && (
                                                        <span className="shrink-0 rounded-md bg-muted px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                                            {b.single_or_twin}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="mt-1 text-xs font-medium text-muted-foreground">
                                                    {b.client?.name ? `Agency: ${b.client.name}` : 'Agency: —'}
                                                </div>
                                                <div className="mt-2 text-[12px] text-muted-foreground">
                                                    <Clock className="mr-1 inline size-3" /> {formatDate(b.check_in_date)}{' '}
                                                    <ArrowRight className="mx-1 inline size-3" /> {b.check_out_date ? formatDate(b.check_out_date) : 'OPEN'}
                                                </div>
                                            </div>

                                            {b.confirmation_number && (
                                                <div className="mt-4 grid gap-2 rounded-xl bg-muted/20 p-3">
                                                    <div className="flex items-start gap-2 text-[13px]">
                                                        <Hash className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                                                        <div>
                                                            <span className="font-semibold text-foreground">Confirmation:</span>{' '}
                                                            <span className="text-muted-foreground">{b.confirmation_number}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            <div className="mt-4 flex flex-wrap items-center justify-end gap-2 border-t border-border/30 pt-3">
                                                <Link
                                                    href={toUrl(staysShow({ booking: b.id }))}
                                                    onClick={(e) => e.stopPropagation()}
                                                    className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-border/60 bg-muted/40 px-3 py-1.5 text-[12px] font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                                                >
                                                    <Eye className="size-3.5" /> View
                                                </Link>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </GlassCard>

                {bookings.links?.length > 0 && (
                    <PaginationBar
                        links={bookings.links}
                        onVisit={(url) => router.get(url, {}, { preserveScroll: true, preserveState: true })}
                        left={<RowsPerPageSelect value={perPage} onChange={setPerPage} />}
                    />
                )}
            </div>
        </PageLayout>
    );
}

HotelStaysIndex.layout = (page: React.ReactNode) => page;


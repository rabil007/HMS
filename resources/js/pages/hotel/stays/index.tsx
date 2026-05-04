import { Head, router } from '@inertiajs/react';
import { Bed, CalendarCheck, Clock, Hash } from 'lucide-react';
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

                <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
                    <div className="w-full sm:flex-1">
                        <ListSearch value={q} onChange={setQ} placeholder="Search guest, email, phone, agency, confirmation…" />
                    </div>
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

                <GlassCard as="section" className="flex flex-col overflow-hidden min-h-[500px]">
                    <div className="p-4 sm:p-6 flex-1 bg-background/20">
                        {bookings.data.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 h-full text-center opacity-60">
                                <Bed className="size-12 mb-3 text-muted-foreground" />
                                <p className="text-sm font-medium">No records found.</p>
                                <p className="text-xs text-muted-foreground mt-1">Try a different search or tab.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 gap-4">
                                {bookings.data.map((b) => {
                                    const pill = statusPill(b);

                                    return (
                                        <div
                                            key={b.id}
                                            onClick={() => router.get(toUrl(staysShow({ booking: b.id })))}
                                            className="group flex flex-col p-5 rounded-2xl border border-border/40 bg-card hover:bg-muted/30 transition-all shadow-sm cursor-pointer"
                                        >
                                            <div className="flex items-start justify-between gap-4">
                                                <div className="min-w-0 flex-1">
                                                    <div className="font-bold text-base text-foreground truncate flex items-center gap-2">
                                                        {b.guest_name ?? 'Guest'}
                                                        <Badge variant="outline" className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide ${pill.cls}`}>
                                                            {pill.label}
                                                        </Badge>
                                                        {b.single_or_twin && (
                                                            <span className="px-2 py-0.5 rounded-md bg-muted text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
                                                                {b.single_or_twin}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="text-xs text-muted-foreground mt-1 font-medium">
                                                        {b.client?.name ? `Agency: ${b.client.name}` : 'Agency: —'}
                                                    </div>
                                                    <div className="text-[12px] text-muted-foreground mt-2">
                                                        <Clock className="inline size-3 mr-1" /> {formatDate(b.check_in_date)} → {b.check_out_date ? formatDate(b.check_out_date) : 'OPEN'}
                                                    </div>
                                                    <div className="text-[12px] text-muted-foreground mt-1">
                                                        <Hash className="inline size-3 mr-1" /> {b.confirmation_number ?? '—'}
                                                    </div>
                                                </div>
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


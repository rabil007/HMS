import { Head, Link, router, usePage } from '@inertiajs/react';
import { Bed, Building2, CalendarCheck, CheckCircle2, Clock, Hash, RefreshCw } from 'lucide-react';
import React, { useMemo, useState } from 'react';
import { ListSearch } from '@/components/list/list-search';
import { PaginationBar } from '@/components/list/pagination-bar';
import { RowsPerPageSelect } from '@/components/list/rows-per-page-select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useIndexQueryParams } from '@/hooks/use-index-query-params';
import PageLayout from '@/layouts/page-layout';
import { toUrl } from '@/lib/utils';
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
    const page = usePage();
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
        if (b.actual_check_out_date) {
            return { label: 'Checked out', cls: 'bg-slate-500/15 text-slate-200 border-border/40' };
        }

        if (b.actual_check_in_date) {
            return { label: 'In-house', cls: 'bg-sky-500/15 text-sky-400 border-sky-500/20' };
        }

        return { label: 'To check-in', cls: 'bg-amber-500/15 text-amber-500 border-amber-500/20' };
    };

    return (
        <PageLayout title="Check-in / Check-out" backHref={toUrl(dashboard())}>
            <Head title="Check-in / Check-out" />

            <div className="max-w-[1000px] mx-auto space-y-8 pb-10">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-sky-500/10">
                            <CalendarCheck className="size-6 text-sky-500" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold tracking-tight text-foreground">Check-in / Check-out</h2>
                            <p className="text-muted-foreground text-sm">Verify confirmation and manage guest stays.</p>
                        </div>
                    </div>
                    <Button asChild variant="outline" className="rounded-full px-5">
                        <Link href={page.url} preserveScroll preserveState replace>
                            <RefreshCw className="size-4 mr-2" /> Refresh
                        </Link>
                    </Button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    <div className="rounded-2xl border border-border/50 bg-card/40 p-4">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">To check-in</span>
                            <Clock className="size-4 text-amber-500" />
                        </div>
                        <div className="mt-2 text-2xl font-bold">{counts.to_checkin}</div>
                    </div>
                    <div className="rounded-2xl border border-border/50 bg-card/40 p-4">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">In-house</span>
                            <Building2 className="size-4 text-sky-500" />
                        </div>
                        <div className="mt-2 text-2xl font-bold">{counts.in_house}</div>
                    </div>
                    <div className="rounded-2xl border border-border/50 bg-card/40 p-4">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Checked out</span>
                            <CheckCircle2 className="size-4 text-emerald-500" />
                        </div>
                        <div className="mt-2 text-2xl font-bold">{counts.checked_out}</div>
                    </div>
                    <div className="rounded-2xl border border-border/50 bg-card/40 p-4">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Total</span>
                            <Hash className="size-4 text-muted-foreground" />
                        </div>
                        <div className="mt-2 text-2xl font-bold">{counts.total}</div>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
                    <div className="w-full sm:flex-1">
                        <ListSearch value={q} onChange={setQ} placeholder="Search guest, email, phone, agency, confirmation…" />
                    </div>
                </div>

                <div className="flex items-center gap-2 p-1.5 bg-muted/40 rounded-2xl border border-border/40 w-fit">
                    <button
                        onClick={() => setTab('to_checkin')}
                        className={`flex items-center gap-2 px-5 py-2 rounded-xl text-[13px] font-bold transition-all ${
                            tab === 'to_checkin' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
                        }`}
                    >
                        To check-in{' '}
                        <Badge className={`${tab === 'to_checkin' ? 'bg-amber-500/20 text-amber-500' : 'bg-muted-foreground/20 text-muted-foreground'} hover:bg-transparent`}>
                            {counts.to_checkin}
                        </Badge>
                    </button>
                    <button
                        onClick={() => setTab('in_house')}
                        className={`flex items-center gap-2 px-5 py-2 rounded-xl text-[13px] font-bold transition-all ${
                            tab === 'in_house' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
                        }`}
                    >
                        In-house{' '}
                        <Badge className={`${tab === 'in_house' ? 'bg-sky-500/20 text-sky-400' : 'bg-muted-foreground/20 text-muted-foreground'} hover:bg-transparent`}>
                            {counts.in_house}
                        </Badge>
                    </button>
                    <button
                        onClick={() => setTab('checked_out')}
                        className={`flex items-center gap-2 px-5 py-2 rounded-xl text-[13px] font-bold transition-all ${
                            tab === 'checked_out' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
                        }`}
                    >
                        Checked out{' '}
                        <Badge className={`${tab === 'checked_out' ? 'bg-emerald-500/20 text-emerald-500' : 'bg-muted-foreground/20 text-muted-foreground'} hover:bg-transparent`}>
                            {counts.checked_out}
                        </Badge>
                    </button>
                </div>

                <section className="rounded-4xl border border-border/50 bg-card/40 backdrop-blur-xl flex flex-col shadow-lg overflow-hidden min-h-[500px]">
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
                </section>

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


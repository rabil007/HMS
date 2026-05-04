import { Head, Link, router, usePage } from '@inertiajs/react';
import { useReactTable, getCoreRowModel, flexRender  } from '@tanstack/react-table';
import type {ColumnDef} from '@tanstack/react-table';
import { ArrowUpDown, CalendarCheck, CalendarDays, CheckCircle2, Clock, Eye, Pencil, Plus, Trash2, XCircle } from 'lucide-react';
import React from 'react';
import { DateRangeFilterDialog } from '@/components/date-range-filter-dialog';
import { SectionHeader } from '@/components/layout/section-header';
import { ListSearch } from '@/components/list/list-search';
import { PaginationBar } from '@/components/list/pagination-bar';
import { RowsPerPageSelect } from '@/components/list/rows-per-page-select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useConfirmDialog } from '@/hooks/use-confirm-dialog';
import { useIndexQueryParams } from '@/hooks/use-index-query-params';
import PageLayout from '@/layouts/page-layout';
import { toUrl } from '@/lib/utils';
import { dashboard } from '@/routes';
import { create, destroy, edit, index as bookingsIndex, show } from '@/routes/bookings';

type Paged<T> = {
    data: T[];
    links: { url: string | null; label: string; active: boolean }[];
    meta: { current_page: number; last_page: number; per_page: number; total: number };
};

function todayIsoLocal(): string {
    const d = new Date();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');

    return `${d.getFullYear()}-${m}-${day}`;
}

export default function BookingsIndex({
    bookings,
    filters,
    counts,
    overallTotal,
    adminFilters,
    hotelFilters,
}: {
    bookings: Paged<any>;
    filters: {
        q?: string;
        status?: string;
        column?: Record<string, string>;
        date_scope?: string | null;
        sort?: string;
        dir?: 'asc' | 'desc';
        per_page?: number;
    };
    counts: { total: number; pending: number; confirmed: number; rejected: number };
    overallTotal: number;
    adminFilters?: { hotels: Array<{ id: number; name: string }>; clients: Array<{ id: number; name: string }> } | null;
    hotelFilters?: Array<{ id: number; name: string }> | null;
}) {
    const fmt = (d: string) =>
        new Date(d).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });

    const { auth } = usePage().props as any;
    const user = auth.user as any;
    const isAdmin = user?.role === 'admin';
    const isClient = user?.role === 'client';

    const statusBadge = (s: string) => {
        const v = String(s || '').toLowerCase();

        if (v === 'pending') {
            return { label: 'Pending', className: 'bg-warning/15 text-warning border-warning/20' };
        }

        if (v === 'confirmed') {
            return { label: 'Confirmed', className: 'bg-success/15 text-success border-success/20' };
        }

        if (v === 'rejected') {
            return { label: 'Rejected', className: 'bg-destructive/15 text-destructive border-destructive/20' };
        }

        return { label: s, className: 'bg-muted/40 text-muted-foreground border-border/40' };
    };

    const [hotelId, setHotelId] = React.useState<string>(filters.column?.hotel_id ?? '');
    const [clientId, setClientId] = React.useState<string>(filters.column?.client_id ?? '');
    const [status, setStatus] = React.useState<string>(filters.status ?? '');
    const [checkInFrom, setCheckInFrom] = React.useState<string>(filters.column?.check_in_from ?? '');
    const [checkInTo, setCheckInTo] = React.useState<string>(filters.column?.check_in_to ?? '');
    const [dateScopeAll, setDateScopeAll] = React.useState<boolean>(filters.date_scope === 'all');
    const [dateFilterOpen, setDateFilterOpen] = React.useState(false);

    React.useEffect(() => {
        setCheckInFrom(filters.column?.check_in_from ?? '');
        setCheckInTo(filters.column?.check_in_to ?? '');
        setDateScopeAll(filters.date_scope === 'all');
    }, [filters.column?.check_in_from, filters.column?.check_in_to, filters.date_scope]);

    const extras = React.useMemo(
        () => ({
            status: status || undefined,
            ...(dateScopeAll
                ? { date_scope: 'all' }
                : {
                    'filters[check_in_from]': checkInFrom || undefined,
                    'filters[check_in_to]': checkInTo || undefined,
                }),
            ...((isAdmin || isClient) ? { 'filters[hotel_id]': hotelId || undefined } : {}),
            ...(isAdmin ? { 'filters[client_id]': clientId || undefined } : {}),
        }),
        [status, isAdmin, isClient, hotelId, clientId, checkInFrom, checkInTo, dateScopeAll],
    );

    const { q, setQ, perPage, setPerPage, toggleSort } = useIndexQueryParams({
        href: bookingsIndex(),
        filters,
        extras,
        defaultPerPage: 15,
    });
    const dateNotDefaultToday =
        !dateScopeAll && (checkInFrom !== todayIsoLocal() || checkInTo !== todayIsoLocal());
    const showReset = Boolean(q || status || hotelId || clientId || dateScopeAll || dateNotDefaultToday);
    const slOffset = ((bookings?.meta?.current_page ?? 1) - 1) * (bookings?.meta?.per_page ?? 10);

    const { requestConfirm, ConfirmDialog } = useConfirmDialog();

    const columns = React.useMemo<ColumnDef<any>[]>(
        () => [
            {
                id: 'slno',
                header: () => <span>Sl No.</span>,
                cell: ({ row }) => (
                    <Link href={toUrl(show({ booking: row.original.id }))} className="text-[13px] font-semibold hover:underline">
                        {slOffset + row.index + 1}
                    </Link>
                ),
            },
            {
                id: 'hotel',
                header: () => <button type="button" className="inline-flex items-center gap-2" onClick={() => toggleSort('created_at')}>Hotel</button>,
                cell: ({ row }) => <span>{row.original.hotel?.name}</span>,
            },
            ...(isAdmin
                ? ([
                      {
                          id: 'client',
                          header: () => <span>Client</span>,
                          cell: ({ row }) => <span>{row.original.client?.name ?? 'OMS'}</span>,
                      },
                  ] as ColumnDef<any>[])
                : []),
            {
                accessorKey: 'status',
                header: () => <button type="button" className="inline-flex items-center gap-2" onClick={() => toggleSort('status')}>Status <ArrowUpDown className="size-4" /></button>,
                cell: ({ row }) => {
                    const meta = statusBadge(row.original.status);

                    return (
                        <Badge variant="outline" className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide ${meta.className}`}>
                            {meta.label}
                        </Badge>
                    );
                },
            },
            {
                accessorKey: 'guest_name',
                header: () => <button type="button" className="inline-flex items-center gap-2" onClick={() => toggleSort('guest_name')}>Guest <ArrowUpDown className="size-4" /></button>,
            },
            {
                accessorKey: 'guest_email',
                header: () => <button type="button" className="inline-flex items-center gap-2" onClick={() => toggleSort('guest_email')}>Email <ArrowUpDown className="size-4" /></button>,
            },
            {
                id: 'dates',
                header: () => <button type="button" className="inline-flex items-center gap-2" onClick={() => toggleSort('check_in_date')}>Dates <ArrowUpDown className="size-4" /></button>,
                cell: ({ row }) => (
                    <div className="text-[12px] text-muted-foreground leading-5">
                        <div>
                            <span className="font-semibold text-foreground/80">Scheduled:</span>{' '}
                            {fmt(row.original.check_in_date)} → {row.original.check_out_date ? fmt(row.original.check_out_date) : 'Open'}
                        </div>
                        <div>
                            <span className="font-semibold text-foreground/80">Actual:</span>{' '}
                            {row.original.actual_check_in_date
                                ? `${fmt(row.original.actual_check_in_date)} → ${row.original.actual_check_out_date ? fmt(row.original.actual_check_out_date) : 'Open'}`
                                : '—'}
                        </div>
                    </div>
                ),
            },
            {
                id: 'actions',
                header: () => <span>Actions</span>,
                cell: ({ row }) => (
                    <div className="flex items-center justify-end gap-1">
                        <Link
                            href={toUrl(show({ booking: row.original.id }))}
                            onClick={(e) => e.stopPropagation()}
                            className="flex items-center justify-center h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
                            title="View booking"
                        >
                            <Eye className="size-3.5" />
                        </Link>
                        <Link
                            href={toUrl(edit({ booking: row.original.id }))}
                            onClick={(e) => e.stopPropagation()}
                            className="flex items-center justify-center h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
                            title="Edit booking"
                        >
                            <Pencil className="size-3.5" />
                        </Link>
                        {row.original.status === 'pending' && (
                            <button
                                type="button"
                                title="Cancel booking"
                                onClick={async (e) => {
                                    e.stopPropagation();

                                    if (
                                        !(await requestConfirm({
                                            title: 'Cancel this booking?',
                                            description: 'This will remove the pending request.',
                                            confirmText: 'Cancel booking',
                                            variant: 'destructive',
                                        }))
                                    ) {
                                        return;
                                    }

                                    router.delete(toUrl(destroy({ booking: row.original.id })), { preserveScroll: true });
                                }}
                                className="flex items-center justify-center h-8 w-8 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                            >
                                <Trash2 className="size-3.5" />
                            </button>
                        )}
                    </div>
                ),
            },
        ],
        [slOffset, isAdmin, requestConfirm, toggleSort],
    );

    const table = useReactTable({
        data: bookings.data,
        columns,
        getCoreRowModel: getCoreRowModel(),
        manualPagination: true,
        manualSorting: true,
        manualFiltering: true,
    });

    return (
        <PageLayout title="Bookings" backHref={toUrl(dashboard())}>
            <ConfirmDialog />
            <Head title="My Bookings" />
            
            {/* ── Top bar ────────────────────────── */}
            <SectionHeader
                title="My Bookings"
                subtitle="Your hotel reservation history"
                right={(
                    <Button asChild className="w-full sm:w-auto rounded-full px-4 text-[14px] sm:text-[14px]">
                        <Link href={toUrl(create())}>
                            <Plus className="size-3.5 sm:size-4 mr-1.5 sm:mr-2" /> New
                        </Link>
                    </Button>
                )}
                className="mb-8"
            />

            {/* ── Stats cards ─────────────────────── */}
            {overallTotal > 0 && (
                <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {([
                        {
                            label: 'Total',
                            filter: '' as const,
                            value: counts.total,
                            Icon: CalendarCheck,
                            accent: 'border-t-primary/60',
                            iconBg: 'bg-primary/10',
                            iconColor: 'text-primary',
                            valueCls: 'text-foreground',
                            activeRing: 'ring-2 ring-primary/40 border-primary/50 bg-primary/5',
                        },
                        {
                            label: 'Pending',
                            filter: 'pending' as const,
                            value: counts.pending,
                            Icon: Clock,
                            accent: 'border-t-warning/60',
                            iconBg: 'bg-warning/10',
                            iconColor: 'text-warning',
                            valueCls: 'text-warning',
                            activeRing: 'ring-2 ring-warning/40 border-warning/50 bg-warning/5',
                        },
                        {
                            label: 'Confirmed',
                            filter: 'confirmed' as const,
                            value: counts.confirmed,
                            Icon: CheckCircle2,
                            accent: 'border-t-success/60',
                            iconBg: 'bg-success/10',
                            iconColor: 'text-success',
                            valueCls: 'text-success',
                            activeRing: 'ring-2 ring-success/40 border-success/50 bg-success/5',
                        },
                        {
                            label: 'Rejected',
                            filter: 'rejected' as const,
                            value: counts.rejected,
                            Icon: XCircle,
                            accent: 'border-t-destructive/60',
                            iconBg: 'bg-destructive/10',
                            iconColor: 'text-destructive',
                            valueCls: 'text-destructive',
                            activeRing: 'ring-2 ring-destructive/40 border-destructive/50 bg-destructive/5',
                        },
                    ] as const).map(({ label, filter, value, Icon, accent, iconBg, iconColor, valueCls, activeRing }) => {
                        const active = filter === '' ? !status : status === filter;

                        return (
                            <button
                                key={label}
                                type="button"
                                aria-pressed={active}
                                aria-label={filter === '' ? 'Show all bookings' : `Show ${label.toLowerCase()} bookings`}
                                onClick={() => setStatus(filter)}
                                className={[
                                    'relative w-full overflow-hidden rounded-2xl border border-t-2 p-4 text-left backdrop-blur-sm transition-all outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50',
                                    accent,
                                    active ? activeRing : 'border-border/50 bg-card/40 hover:bg-card/60',
                                ].join(' ')}
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                        <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">{label}</p>
                                        <p className={`mt-1 text-3xl font-black tabular-nums leading-none ${valueCls}`}>{value}</p>
                                    </div>
                                    <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${iconBg}`}>
                                        <Icon className={`size-4.5 ${iconColor}`} />
                                    </span>
                                </div>
                                {counts.total > 0 && (
                                    <div className="mt-3 h-0.5 w-full overflow-hidden rounded-full bg-border/40">
                                        <div
                                            className={`h-full rounded-full transition-all duration-700 ${iconColor} opacity-60`}
                                            style={{ width: `${Math.round((value / counts.total) * 100)}%`, background: 'currentColor' }}
                                        />
                                    </div>
                                )}
                            </button>
                        );
                    })}
                </div>
            )}

            {overallTotal > 0 && (
                <>
                    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
                    <div className="w-full sm:flex-1 sm:max-w-lg">
                        <ListSearch
                            value={q}
                            onChange={setQ}
                            placeholder="Search guest, phone, email...."
                        />
                    </div>
                            
                    {isAdmin && adminFilters && (
                        <>
                            <div className="flex w-full gap-3 sm:hidden">
                                <div className="w-1/2">
                                    <Select value={hotelId || 'all'} onValueChange={(v) => setHotelId(v === 'all' ? '' : v)}>
                                        <SelectTrigger className="w-full rounded-xl bg-muted/30">
                                            <SelectValue placeholder="All hotels" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All hotels</SelectItem>
                                            {adminFilters.hotels.map((h) => (
                                                <SelectItem key={h.id} value={String(h.id)}>
                                                    {h.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="w-1/2">
                                    <Select value={clientId || 'all'} onValueChange={(v) => setClientId(v === 'all' ? '' : v)}>
                                        <SelectTrigger className="w-full rounded-xl bg-muted/30">
                                            <SelectValue placeholder="All clients" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All clients</SelectItem>
                                            {adminFilters.clients.map((c) => (
                                                <SelectItem key={c.id} value={String(c.id)}>
                                                    {c.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="w-full sm:w-[240px] hidden sm:block">
                                <Select value={hotelId || 'all'} onValueChange={(v) => setHotelId(v === 'all' ? '' : v)}>
                                    <SelectTrigger className="w-full rounded-xl bg-muted/30">
                                        <SelectValue placeholder="All hotels" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All hotels</SelectItem>
                                        {adminFilters.hotels.map((h) => (
                                            <SelectItem key={h.id} value={String(h.id)}>
                                                {h.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="w-full sm:w-[240px] hidden sm:block">
                                <Select value={clientId || 'all'} onValueChange={(v) => setClientId(v === 'all' ? '' : v)}>
                                    <SelectTrigger className="w-full rounded-xl bg-muted/30">
                                        <SelectValue placeholder="All clients" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All clients</SelectItem>
                                        {adminFilters.clients.map((c) => (
                                            <SelectItem key={c.id} value={String(c.id)}>
                                                {c.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </>
                    )}

                    {isClient && hotelFilters && (
                        <div className="w-full sm:w-[260px]">
                            <Select value={hotelId || 'all'} onValueChange={(v) => setHotelId(v === 'all' ? '' : v)}>
                                <SelectTrigger className="w-full rounded-xl bg-muted/30">
                                    <SelectValue placeholder="All hotels" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All hotels</SelectItem>
                                    {hotelFilters.map((h) => (
                                        <SelectItem key={h.id} value={String(h.id)}>
                                            {h.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:shrink-0">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setDateFilterOpen(true)}
                            className="rounded-xl"
                        >
                            <CalendarDays className="mr-2 size-4" />
                            Date filter
                        </Button>
                        {dateScopeAll && (
                            <span className="text-xs font-medium text-muted-foreground">All dates</span>
                        )}
                        {!dateScopeAll && (checkInFrom || checkInTo) && (
                            <span
                                className="text-xs font-medium text-muted-foreground sm:max-w-[min(100%,18rem)] sm:truncate"
                                title={[checkInFrom || '…', checkInTo || '…'].join(' → ')}
                            >
                                {checkInFrom || '…'} → {checkInTo || '…'}
                            </span>
                        )}
                    </div>

                    {showReset && (
                        <div className="flex items-center gap-2 sm:ml-auto">
                            <Button
                                type="button"
                                variant="outline"
                                className="rounded-xl px-4"
                                onClick={() => {
                                    setQ('');
                                    setHotelId('');
                                    setClientId('');
                                    setStatus('');
                                    setDateScopeAll(false);
                                    setCheckInFrom('');
                                    setCheckInTo('');
                                    router.get(toUrl(bookingsIndex()), {}, { preserveScroll: true, preserveState: true, replace: true });
                                }}
                            >
                                Reset
                            </Button>
                        </div>
                    )}
                    </div>

                    <DateRangeFilterDialog
                        open={dateFilterOpen}
                        onOpenChange={setDateFilterOpen}
                        from={checkInFrom}
                        to={checkInTo}
                        onApply={(from, to) => {
                            if (!from && !to) {
                                setDateScopeAll(true);
                                setCheckInFrom('');
                                setCheckInTo('');

                                return;
                            }

                            setDateScopeAll(false);
                            setCheckInFrom(from);
                            setCheckInTo(to);
                        }}
                        onClear={() => {
                            setDateScopeAll(true);
                            setCheckInFrom('');
                            setCheckInTo('');
                        }}
                        title="Date filter"
                        description="Filter by scheduled check-in date (check-in date on the booking)."
                    />
                </>
            )}

            {/* ── Empty ───────────────────────────── */}
            {overallTotal === 0 && (
                <div className="flex flex-col items-center justify-center py-28 text-center">
                    <p className="text-[15px] font-medium text-foreground">No bookings yet</p>
                    <p className="text-[13px] text-muted-foreground mt-1 mb-6">Start by submitting a new request.</p>
                    <Link
                        href={toUrl(create())}
                        className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-primary hover:underline underline-offset-4"
                    >
                        New Booking
                    </Link>
                </div>
            )}

            {overallTotal > 0 && (
                <>
                    {/* ── Mobile card list (< sm) ──────────── */}
                    <div className="sm:hidden space-y-3">
                        {bookings.data.length === 0 ? (
                            <div className="rounded-2xl border border-border/60 bg-card/40 px-4 py-10 text-center">
                                <p className="text-[15px] font-medium text-foreground">No results</p>
                                <p className="text-[13px] text-muted-foreground mt-1">Try a different search or clear filters.</p>
                            </div>
                        ) : (
                            bookings.data.map((booking: any, i: number) => {
                                const meta = statusBadge(booking.status);
                                const rowBg =
                                    booking.status === 'pending'
                                        ? 'bg-warning/5 border-warning/20'
                                        : booking.status === 'confirmed'
                                          ? 'bg-success/5 border-success/20'
                                          : booking.status === 'rejected'
                                            ? 'bg-destructive/5 border-destructive/20'
                                            : 'bg-card/40 border-border/60';

                                return (
                                    <div
                                        key={booking.id}
                                        role="button"
                                        tabIndex={0}
                                        onClick={() => router.visit(toUrl(show({ booking: booking.id })))}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' || e.key === ' ') {
                                                e.preventDefault();
                                                router.visit(toUrl(show({ booking: booking.id })));
                                            }
                                        }}
                                        className={`rounded-2xl border p-4 cursor-pointer active:scale-[0.98] transition-all ${rowBg}`}
                                    >
                                        {/* Row: index + hotel + status */}
                                        <div className="flex items-start justify-between gap-2 mb-3">
                                            <div className="min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[11px] font-bold text-muted-foreground tabular-nums">
                                                        #{slOffset + i + 1}
                                                    </span>
                                                    <span className="text-[14px] font-semibold text-foreground truncate">
                                                        {booking.hotel?.name ?? '—'}
                                                    </span>
                                                </div>
                                                {isAdmin && booking.client && (
                                                    <p className="text-[12px] text-muted-foreground mt-0.5">{booking.client.name}</p>
                                                )}
                                            </div>
                                            <Badge
                                                variant="outline"
                                                className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide ${meta.className}`}
                                            >
                                                {meta.label}
                                            </Badge>
                                        </div>

                                        {/* Guest info */}
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Guest</span>
                                            <span className="text-[13px] font-medium text-foreground">{booking.guest_name || '—'}</span>
                                        </div>

                                        {/* Dates */}
                                        <div className="text-[12px] text-muted-foreground space-y-0.5 mb-3 leading-5">
                                            <div>
                                                <span className="font-semibold text-foreground/70">Scheduled: </span>
                                                {fmt(booking.check_in_date)} → {booking.check_out_date ? fmt(booking.check_out_date) : 'Open'}
                                            </div>
                                            {booking.actual_check_in_date && (
                                                <div>
                                                    <span className="font-semibold text-foreground/70">Actual: </span>
                                                    {fmt(booking.actual_check_in_date)} → {booking.actual_check_out_date ? fmt(booking.actual_check_out_date) : 'Open'}
                                                </div>
                                            )}
                                        </div>

                                        {/* Action buttons */}
                                        <div className="flex items-center justify-end gap-2 border-t border-border/30 pt-3">
                                            <Link
                                                href={toUrl(show({ booking: booking.id }))}
                                                onClick={(e) => e.stopPropagation()}
                                                className="inline-flex items-center gap-1.5 rounded-lg border border-border/60 bg-muted/40 px-3 py-1.5 text-[12px] font-semibold text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                                            >
                                                <Eye className="size-3.5" /> View
                                            </Link>
                                            <Link
                                                href={toUrl(edit({ booking: booking.id }))}
                                                onClick={(e) => e.stopPropagation()}
                                                className="inline-flex items-center gap-1.5 rounded-lg border border-border/60 bg-muted/40 px-3 py-1.5 text-[12px] font-semibold text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                                            >
                                                <Pencil className="size-3.5" /> Edit
                                            </Link>
                                            {booking.status === 'pending' && (
                                                <button
                                                    type="button"
                                                    onClick={async (e) => {
                                                        e.stopPropagation();

                                                        if (
                                                            !(await requestConfirm({
                                                                title: 'Cancel this booking?',
                                                                description: 'This will remove the pending request.',
                                                                confirmText: 'Cancel booking',
                                                                variant: 'destructive',
                                                            }))
                                                        ) {
                                                            return;
                                                        }

                                                        router.delete(toUrl(destroy({ booking: booking.id })), { preserveScroll: true });
                                                    }}
                                                    className="inline-flex items-center gap-1.5 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-1.5 text-[12px] font-semibold text-destructive hover:bg-destructive/20 transition-colors"
                                                >
                                                    <Trash2 className="size-3.5" /> Cancel
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>

                    {/* ── Desktop table (≥ sm) ─────────────── */}
                    <div className="hidden sm:block rounded-2xl border border-border/60 bg-card/40 overflow-hidden">
                        <div className="w-full overflow-x-auto">
                            <table className="w-full min-w-max text-sm">
                                <thead className="bg-muted/30">
                                    {table.getHeaderGroups().map((hg) => (
                                        <tr key={hg.id} className="border-b border-border/40">
                                            {hg.headers.map((h) => (
                                                <th key={h.id} className="text-left px-4 py-3 font-semibold text-foreground whitespace-nowrap">
                                                    {h.isPlaceholder ? null : flexRender(h.column.columnDef.header, h.getContext())}
                                                </th>
                                            ))}
                                        </tr>
                                    ))}
                                </thead>
                                <tbody>
                                    {bookings.data.length === 0 ? (
                                        <tr className="border-b border-border/30 last:border-0">
                                            <td colSpan={columns.length} className="px-4 py-10 text-center">
                                                <p className="text-[15px] font-medium text-foreground">No results</p>
                                                <p className="text-[13px] text-muted-foreground mt-1">Try a different search or clear filters.</p>
                                            </td>
                                        </tr>
                                    ) : (
                                        table.getRowModel().rows.map((row) => (
                                            <tr
                                                key={row.id}
                                                role="button"
                                                tabIndex={0}
                                                onClick={() => router.visit(toUrl(show({ booking: row.original.id })))}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter' || e.key === ' ') {
                                                        e.preventDefault();
                                                        router.visit(toUrl(show({ booking: row.original.id })));
                                                    }
                                                }}
                                                className={`border-b border-border/30 last:border-0 hover:bg-muted/20 cursor-pointer ${
                                                    row.original.status === 'pending'
                                                        ? 'bg-warning/5'
                                                        : row.original.status === 'confirmed'
                                                          ? 'bg-success/5'
                                                          : row.original.status === 'rejected'
                                                            ? 'bg-destructive/5'
                                                            : ''
                                                }`}
                                            >
                                                {row.getVisibleCells().map((cell) => (
                                                    <td key={cell.id} className="px-4 py-3 align-middle whitespace-nowrap">
                                                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                                    </td>
                                                ))}
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            )}

            {bookings.links?.length > 0 && (
                <PaginationBar
                    links={bookings.links}
                    onVisit={(url) => router.get(url, {}, { preserveScroll: true, preserveState: true })}
                    left={<RowsPerPageSelect value={perPage} onChange={setPerPage} />}
                />
            )}
        </PageLayout>
    );
}

BookingsIndex.layout = (page: React.ReactNode) => page;

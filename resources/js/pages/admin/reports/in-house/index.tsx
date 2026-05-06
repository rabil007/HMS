import { Head, router } from '@inertiajs/react';
import { flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table';
import type { ColumnDef } from '@tanstack/react-table';
import { BedDouble, CalendarDays, Download, Filter, RotateCcw } from 'lucide-react';
import React from 'react';
import { DateRangeFilterDialog } from '@/components/date-range-filter-dialog';
import { GlassCard } from '@/components/layout/glass-card';
import { SectionHeader } from '@/components/layout/section-header';
import { ListSearch } from '@/components/list/list-search';
import { PaginationBar } from '@/components/list/pagination-bar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useIndexQueryParams } from '@/hooks/use-index-query-params';
import PageLayout from '@/layouts/page-layout';
import { toUrl, dateRangeFilterButtonLabel } from '@/lib/utils';
import { dashboard } from '@/routes';
import { index as inHouseIndex, exportMethod as inHouseExport } from '@/routes/admin/reports/in-house';

type Paged<T> = {
    data: T[];
    links: { url: string | null; label: string; active: boolean }[];
    meta: { current_page: number; last_page: number; per_page: number; total: number };
};

type Option = { id: number; name: string };

type BookingRow = {
    id: number;
    public_id: string | null;
    status: string;
    confirmation_number: string | null;
    guest_name: string | null;
    guest_email: string | null;
    guest_phone: string | null;
    check_in_date: string | null;
    actual_check_in_date: string | null;
    guest_check_in: string | null;
    guest_check_out: string | null;
    single_or_twin: string | null;
    room_number: string | null;
    remarks: string | null;
    hotel?: { id: number; name: string } | null;
    client?: { id: number; name: string } | null;
    rank?: { id: number; name: string } | null;
    vessel?: { id: number; name: string } | null;
};

function pad2(n: number) {
    return String(n).padStart(2, '0');
}

function dateToDMY(d: Date) {
    return `${pad2(d.getDate())}/${pad2(d.getMonth() + 1)}/${d.getFullYear()}`;
}

function formatDateTimeCell(v: string | null) {
    if (!v) {
        return '';
    }

    const d = new Date(v);

    if (Number.isNaN(d.getTime())) {
        return '';
    }

    const date = dateToDMY(d);
    const time = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

    return `${date} ${time}`;
}

function nightsStayed(checkInStr: string | null): number {
    if (!checkInStr) {
        return 0;
    }

    const checkIn = new Date(checkInStr);

    if (Number.isNaN(checkIn.getTime())) {
        return 0;
    }

    const msPerDay = 24 * 60 * 60 * 1000;
    const checkInDay = new Date(checkIn.getFullYear(), checkIn.getMonth(), checkIn.getDate());
    const today = new Date();
    const todayDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    return Math.max(0, Math.floor((todayDay.getTime() - checkInDay.getTime()) / msPerDay));
}

function NightsBadge({ checkIn }: { checkIn: string | null }) {
    const nights = nightsStayed(checkIn);

    let variant: 'default' | 'secondary' | 'destructive' = 'default';

    if (nights >= 14) {
        variant = 'destructive';
    } else if (nights >= 7) {
        variant = 'secondary';
    }

    return (
        <Badge variant={variant} className="tabular-nums font-semibold">
            {nights}
        </Badge>
    );
}

export default function AdminInHouseReportIndex({
    bookings,
    inHouseCount,
    filters,
    options,
}: {
    bookings: Paged<BookingRow>;
    inHouseCount: number;
    filters: { q?: string; per_page?: number; column?: any };
    options: { hotels: Option[]; clients: Option[]; ranks: Option[]; vessels: Option[] };
}) {
    const defaultPerPage = 15;
    const [hotelId, setHotelId] = React.useState<string>(filters.column?.hotel_id ?? '');
    const [clientId, setClientId] = React.useState<string>(filters.column?.client_id ?? '');
    const [rankId, setRankId] = React.useState<string>(filters.column?.rank_id ?? '');
    const [vesselId, setVesselId] = React.useState<string>(filters.column?.vessel_id ?? '');
    const [checkInFrom, setCheckInFrom] = React.useState<string>(filters.column?.check_in_from ?? '');
    const [checkInTo, setCheckInTo] = React.useState<string>(filters.column?.check_in_to ?? '');
    const [filtersOpen, setFiltersOpen] = React.useState(false);
    const [dateFilterOpen, setDateFilterOpen] = React.useState(false);

    const { q, setQ, setPerPage, params } = useIndexQueryParams({
        href: inHouseIndex(),
        filters,
        extras: {
            'filters[hotel_id]': hotelId || undefined,
            'filters[client_id]': clientId || undefined,
            'filters[rank_id]': rankId || undefined,
            'filters[vessel_id]': vesselId || undefined,
            'filters[check_in_from]': checkInFrom || undefined,
            'filters[check_in_to]': checkInTo || undefined,
        },
        defaultPerPage,
    });

    const hasDateFilter = Boolean(checkInFrom || checkInTo);

    const activeFilterLabels = [
        hasDateFilter ? `Check-in: ${dateRangeFilterButtonLabel(checkInFrom, checkInTo)}` : null,
        hotelId ? `Hotel: ${options.hotels.find((h) => String(h.id) === hotelId)?.name ?? hotelId}` : null,
        clientId ? `Client: ${options.clients.find((c) => String(c.id) === clientId)?.name ?? clientId}` : null,
        rankId ? `Rank: ${options.ranks.find((r) => String(r.id) === rankId)?.name ?? rankId}` : null,
        vesselId ? `Vessel: ${options.vessels.find((v) => String(v.id) === vesselId)?.name ?? vesselId}` : null,
    ].filter(Boolean) as string[];

    const hasActiveFilters = activeFilterLabels.length > 0 || Boolean(q);

    const slOffset = ((bookings?.meta?.current_page ?? 1) - 1) * (bookings?.meta?.per_page ?? defaultPerPage);

    const columns = React.useMemo<ColumnDef<BookingRow>[]>(
        () => [
            {
                id: 'slno',
                header: () => <span>No</span>,
                cell: ({ row }) => <span className="text-[13px] font-semibold">{slOffset + row.index + 1}</span>,
            },
            {
                accessorKey: 'guest_name',
                header: () => <span>Guest</span>,
                cell: ({ row }) => (
                    <div>
                        <div className="font-medium text-[13px]">{row.original.guest_name ?? '—'}</div>
                        {row.original.guest_phone && (
                            <div className="text-[11px] text-muted-foreground">{row.original.guest_phone}</div>
                        )}
                    </div>
                ),
            },
            {
                accessorKey: 'rank',
                header: () => <span>Rank</span>,
                cell: ({ row }) => <span className="text-[13px]">{row.original.rank?.name ?? '—'}</span>,
            },
            {
                id: 'check_in',
                header: () => <span>Check-in</span>,
                cell: ({ row }) => (
                    <span className="text-[13px]">{formatDateTimeCell(row.original.guest_check_in) || '—'}</span>
                ),
            },
            {
                id: 'nights_stayed',
                header: () => <span>Nights Stayed</span>,
                cell: ({ row }) => <NightsBadge checkIn={row.original.guest_check_in} />,
            },
            {
                accessorKey: 'vessel',
                header: () => <span>Vessel</span>,
                cell: ({ row }) => <span className="text-[13px]">{row.original.vessel?.name ?? '—'}</span>,
            },
            {
                id: 'room_no',
                header: () => <span>Room No.</span>,
                cell: ({ row }) => <span className="text-[13px]">{row.original.room_number ?? '—'}</span>,
            },
            {
                accessorKey: 'single_or_twin',
                header: () => <span>Type</span>,
                cell: ({ row }) => <span className="text-[13px]">{row.original.single_or_twin ?? '—'}</span>,
            },
            {
                accessorKey: 'hotel',
                header: () => <span>Hotel</span>,
                cell: ({ row }) => <span className="text-[13px]">{row.original.hotel?.name ?? '—'}</span>,
            },
            {
                accessorKey: 'client',
                header: () => <span>Client</span>,
                cell: ({ row }) => <span className="text-[13px]">{row.original.client?.name ?? '—'}</span>,
            },
            {
                accessorKey: 'confirmation_number',
                header: () => <span>Confirmation No.</span>,
                cell: ({ row }) => (
                    <span className="font-mono text-[12px]">{row.original.confirmation_number ?? '—'}</span>
                ),
            },
            {
                accessorKey: 'remarks',
                header: () => <span>Remarks</span>,
                cell: ({ row }) => <span className="text-[13px]">{row.original.remarks ?? '—'}</span>,
            },
        ],
        [slOffset],
    );

    const table = useReactTable({
        data: bookings.data,
        columns,
        getCoreRowModel: getCoreRowModel(),
        manualPagination: true,
        manualSorting: true,
        manualFiltering: true,
    });

    const exportHref = toUrl(inHouseExport({ query: params as any }));

    const resetFilters = () => {
        setQ('');
        setCheckInFrom('');
        setCheckInTo('');
        setHotelId('');
        setClientId('');
        setRankId('');
        setVesselId('');
        setPerPage(defaultPerPage);
    };

    return (
        <PageLayout title="In-House Guests" backHref={toUrl(dashboard())}>
            <Head title="In-House Guests" />

            <div className="space-y-6">
                <SectionHeader
                    title="In-House Guests"
                    subtitle={`Currently checked-in guests — ${inHouseCount} in total.`}
                    right={(
                        <Button asChild className="w-full rounded-xl sm:w-auto">
                            <a href={exportHref} className="inline-flex w-full items-center justify-center">
                                <Download className="size-4 mr-2" /> Export Excel
                            </a>
                        </Button>
                    )}
                />

                <div className="flex flex-col gap-4">
                    <div className="flex flex-wrap items-center gap-2">
                        <div className="flex-1 min-w-[200px]">
                            <ListSearch value={q} onChange={setQ} placeholder="Search by guest, confirmation no..." />
                        </div>

                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setDateFilterOpen(true)}
                            className="min-w-0 max-w-full justify-start rounded-xl sm:max-w-[min(100%,20rem)]"
                            title={dateRangeFilterButtonLabel(checkInFrom, checkInTo)}
                        >
                            <CalendarDays className="size-4 shrink-0" />
                            <span className="min-w-0 truncate font-normal">
                                Check-in: {dateRangeFilterButtonLabel(checkInFrom, checkInTo)}
                            </span>
                        </Button>

                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setFiltersOpen((v) => !v)}
                            className="rounded-xl"
                        >
                            <Filter className="mr-2 size-4" />
                            {filtersOpen ? 'Hide Filters' : 'Filters'}
                            {activeFilterLabels.length > 0 && (
                                <span className="ml-1.5 rounded-full bg-primary text-primary-foreground text-[10px] w-4 h-4 inline-flex items-center justify-center font-bold">
                                    {activeFilterLabels.length}
                                </span>
                            )}
                        </Button>

                        {hasActiveFilters && (
                            <Button
                                type="button"
                                variant="outline"
                                onClick={resetFilters}
                                className="rounded-xl"
                            >
                                <RotateCcw className="mr-2 size-4" /> Reset
                            </Button>
                        )}
                    </div>

                    {!filtersOpen && activeFilterLabels.length > 0 && (
                        <GlassCard level="inner" className="p-3 sm:p-4">
                            <div className="flex flex-wrap gap-2">
                                {activeFilterLabels.map((label) => (
                                    <span
                                        key={label}
                                        className="rounded-lg border border-border/60 bg-muted/20 px-2.5 py-1 text-xs font-medium text-muted-foreground"
                                    >
                                        {label}
                                    </span>
                                ))}
                            </div>
                        </GlassCard>
                    )}

                    {filtersOpen && (
                        <GlassCard level="inner" className="p-3 sm:p-4">
                            <div className="grid grid-cols-2 gap-2 xl:grid-cols-4">
                                <Select value={hotelId || 'all'} onValueChange={(v) => setHotelId(v === 'all' ? '' : v)}>
                                    <SelectTrigger className="w-full rounded-xl">
                                        <SelectValue placeholder="Hotel" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All hotels</SelectItem>
                                        {options.hotels.map((h) => (
                                            <SelectItem key={h.id} value={String(h.id)}>
                                                {h.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>

                                <Select value={clientId || 'all'} onValueChange={(v) => setClientId(v === 'all' ? '' : v)}>
                                    <SelectTrigger className="w-full rounded-xl">
                                        <SelectValue placeholder="Client" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All clients</SelectItem>
                                        {options.clients.map((c) => (
                                            <SelectItem key={c.id} value={String(c.id)}>
                                                {c.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>

                                <Select value={rankId || 'all'} onValueChange={(v) => setRankId(v === 'all' ? '' : v)}>
                                    <SelectTrigger className="w-full rounded-xl">
                                        <SelectValue placeholder="Rank" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All ranks</SelectItem>
                                        {options.ranks.map((r) => (
                                            <SelectItem key={r.id} value={String(r.id)}>
                                                {r.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>

                                <Select value={vesselId || 'all'} onValueChange={(v) => setVesselId(v === 'all' ? '' : v)}>
                                    <SelectTrigger className="w-full rounded-xl">
                                        <SelectValue placeholder="Vessel" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All vessels</SelectItem>
                                        {options.vessels.map((v) => (
                                            <SelectItem key={v.id} value={String(v.id)}>
                                                {v.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </GlassCard>
                    )}
                </div>

                <DateRangeFilterDialog
                    open={dateFilterOpen}
                    onOpenChange={setDateFilterOpen}
                    from={checkInFrom}
                    to={checkInTo}
                    onApply={(from, to) => {
                        setCheckInFrom(from);
                        setCheckInTo(to);
                    }}
                    onClear={() => {
                        setCheckInFrom('');
                        setCheckInTo('');
                    }}
                    title="Check-in Date Filter"
                    description="Show only guests who checked in within this date range."
                />

                {/* Summary card */}
                <GlassCard level="inner" className="p-4">
                    <div className="flex items-center gap-3">
                        <div className="rounded-xl bg-primary/10 p-2.5">
                            <BedDouble className="size-5 text-primary" />
                        </div>
                        <div>
                            <div className="text-2xl font-bold tabular-nums">{inHouseCount}</div>
                            <div className="text-xs text-muted-foreground">Guests currently in-house</div>
                        </div>
                    </div>
                </GlassCard>

                <GlassCard className="overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-xs sm:text-sm">
                            <thead className="bg-muted/30">
                                {table.getHeaderGroups().map((hg) => (
                                    <tr key={hg.id} className="border-b border-border/30">
                                        {hg.headers.map((header) => (
                                            <th key={header.id} className="text-left px-4 py-3 font-semibold">
                                                {header.isPlaceholder
                                                    ? null
                                                    : flexRender(header.column.columnDef.header, header.getContext())}
                                            </th>
                                        ))}
                                    </tr>
                                ))}
                            </thead>
                            <tbody>
                                {table.getRowModel().rows.map((row) => (
                                    <tr key={row.id} className="border-b border-border/30 last:border-0 hover:bg-muted/10 transition-colors">
                                        {row.getVisibleCells().map((cell) => (
                                            <td key={cell.id} className="px-4 py-3 whitespace-nowrap">
                                                {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                                {bookings.data.length === 0 && (
                                    <tr>
                                        <td
                                            colSpan={columns.length}
                                            className="px-4 py-16 text-center text-muted-foreground"
                                        >
                                            <div className="flex flex-col items-center gap-2">
                                                <BedDouble className="size-8 opacity-30" />
                                                <span>No guests are currently checked in.</span>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    <div className="p-4 border-t border-border/30">
                        <PaginationBar
                            links={bookings.links}
                            onVisit={(url) => router.get(url, {}, { preserveScroll: true, preserveState: true })}
                        />
                    </div>
                </GlassCard>
            </div>
        </PageLayout>
    );
}

AdminInHouseReportIndex.layout = (page: React.ReactNode) => page;

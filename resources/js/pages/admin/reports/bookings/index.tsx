import { Head } from '@inertiajs/react';
import { flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table';
import type { ColumnDef } from '@tanstack/react-table';
import { Download } from 'lucide-react';
import React from 'react';
import { ListSearch } from '@/components/list/list-search';
import { PaginationBar } from '@/components/list/pagination-bar';
import { RowsPerPageSelect } from '@/components/list/rows-per-page-select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useIndexQueryParams } from '@/hooks/use-index-query-params';
import PageLayout from '@/layouts/page-layout';
import { toUrl } from '@/lib/utils';
import { dashboard } from '@/routes';
import { index as reportIndex, exportMethod as reportExport } from '@/routes/admin/reports/bookings';

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
    check_out_date: string | null;
    actual_check_in_date: string | null;
    actual_check_out_date: string | null;
    guest_check_in: string | null;
    guest_check_out: string | null;
    single_or_twin: string | null;
    remarks: string | null;
    created_at: string | null;
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

function parseDateOnly(v: string) {
    const s = v.slice(0, 10);
    const m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);

    if (!m) {
        return null;
    }

    return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
}

function formatDateCell(v: string | null) {
    if (!v) {
        return '';
    }

    const dateOnly = parseDateOnly(v);

    if (dateOnly) {
        return dateToDMY(dateOnly);
    }

    const d = new Date(v);

    return Number.isNaN(d.getTime()) ? '' : dateToDMY(d);
}

function formatTimeCell(v: string | null) {
    if (!v) {
        return '';
    }

    const d = new Date(v);

    return Number.isNaN(d.getTime())
        ? ''
        : d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function startOfDay(d: Date) {
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function diffDays(a: Date, b: Date) {
    const ms = 24 * 60 * 60 * 1000;

    return Math.floor((startOfDay(b).getTime() - startOfDay(a).getTime()) / ms);
}

function nonNegative(n: number) {
    return n < 0 ? 0 : n;
}

export default function AdminBookingsReportIndex({
    bookings,
    filters,
    options,
}: {
    bookings: Paged<BookingRow>;
    filters: { q?: string; sort?: string; dir?: 'asc' | 'desc'; per_page?: number; column?: any };
    options: { hotels: Option[]; clients: Option[]; ranks: Option[]; vessels: Option[] };
}) {
    const [hotelId, setHotelId] = React.useState<string>(filters.column?.hotel_id ?? '');
    const [clientId, setClientId] = React.useState<string>(filters.column?.client_id ?? '');
    const [rankId, setRankId] = React.useState<string>(filters.column?.rank_id ?? '');
    const [vesselId, setVesselId] = React.useState<string>(filters.column?.vessel_id ?? '');
    const [checkInFrom, setCheckInFrom] = React.useState<string>(filters.column?.check_in_from ?? '');
    const [checkInTo, setCheckInTo] = React.useState<string>(filters.column?.check_in_to ?? '');

    const { q, setQ, perPage, setPerPage, params } = useIndexQueryParams({
        href: reportIndex(),
        filters,
        extras: {
            'filters[hotel_id]': hotelId || undefined,
            'filters[client_id]': clientId || undefined,
            'filters[rank_id]': rankId || undefined,
            'filters[vessel_id]': vesselId || undefined,
            'filters[check_in_from]': checkInFrom || undefined,
            'filters[check_in_to]': checkInTo || undefined,
        },
        defaultPerPage: 15,
    });

    const slOffset = ((bookings?.meta?.current_page ?? 1) - 1) * (bookings?.meta?.per_page ?? 15);

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
                cell: ({ row }) => <span className="font-medium">{row.original.guest_name ?? '—'}</span>,
            },
            {
                accessorKey: 'rank',
                header: () => <span>Rank</span>,
                cell: ({ row }) => <span>{row.original.rank?.name ?? '—'}</span>,
            },
            {
                id: 'check_in_date',
                header: () => <span>Check in Date</span>,
                cell: ({ row }) => {
                    const r = row.original;
                    const d = r.guest_check_in
                        ? formatDateCell(r.guest_check_in)
                        : (r.actual_check_in_date ? formatDateCell(r.actual_check_in_date) : formatDateCell(r.check_in_date));

                    return <span className="text-[13px]">{d || '—'}</span>;
                },
            },
            {
                id: 'check_in_time',
                header: () => <span>Check in Time</span>,
                cell: ({ row }) => <span className="text-[13px]">{formatTimeCell(row.original.guest_check_in) || '—'}</span>,
            },
            {
                id: 'check_out_date',
                header: () => <span>Check out Date</span>,
                cell: ({ row }) => {
                    const r = row.original;

                    if (r.guest_check_out) {
                        return <span className="text-[13px]">{formatDateCell(r.guest_check_out) || '—'}</span>;
                    }

                    const hasAnyCheckIn = Boolean(r.guest_check_in || r.actual_check_in_date || r.check_in_date);

                    return <span className="text-[13px]">{hasAnyCheckIn ? 'OPEN' : '—'}</span>;
                },
            },
            {
                id: 'check_out_time',
                header: () => <span>Check out Time</span>,
                cell: ({ row }) => <span className="text-[13px]">{formatTimeCell(row.original.guest_check_out) || '—'}</span>,
            },
            {
                id: 'nights_until_today',
                header: () => <span>Nights until today</span>,
                cell: ({ row }) => {
                    const r = row.original;
                    const base =
                        (r.guest_check_in ? new Date(r.guest_check_in) : null)
                        ?? (r.actual_check_in_date ? (parseDateOnly(r.actual_check_in_date) ?? new Date(r.actual_check_in_date)) : null)
                        ?? (r.check_in_date ? (parseDateOnly(r.check_in_date) ?? new Date(r.check_in_date)) : null);

                    if (!base || Number.isNaN(base.getTime())) {
                        return <span className="text-[13px]">—</span>;
                    }

                    return <span className="text-[13px]">{nonNegative(diffDays(base, new Date()))}</span>;
                },
            },
            {
                id: 'no_of_nights',
                header: () => <span>No of Nights</span>,
                cell: ({ row }) => {
                    const r = row.original;
                    const inBase =
                        (r.guest_check_in ? new Date(r.guest_check_in) : null)
                        ?? (r.actual_check_in_date ? (parseDateOnly(r.actual_check_in_date) ?? new Date(r.actual_check_in_date)) : null)
                        ?? (r.check_in_date ? (parseDateOnly(r.check_in_date) ?? new Date(r.check_in_date)) : null);
                    const outBase = r.guest_check_out ? new Date(r.guest_check_out) : null;

                    if (!inBase || !outBase || Number.isNaN(inBase.getTime()) || Number.isNaN(outBase.getTime())) {
                        return <span className="text-[13px]">—</span>;
                    }

                    return <span className="text-[13px]">{diffDays(inBase, outBase)}</span>;
                },
            },
            {
                accessorKey: 'vessel',
                header: () => <span>Vessel</span>,
                cell: ({ row }) => <span className="text-[13px]">{row.original.vessel?.name ?? '—'}</span>,
            },
            {
                id: 'room_no',
                header: () => <span>Room no.</span>,
                cell: () => <span className="text-[13px]">—</span>,
            },
            {
                accessorKey: 'single_or_twin',
                header: () => <span>Single or Twin</span>,
                cell: ({ row }) => <span className="text-[13px]">{row.original.single_or_twin ?? '—'}</span>,
            },
            {
                accessorKey: 'confirmation_number',
                header: () => <span>Confirmation Number</span>,
                cell: ({ row }) => <span className="font-mono text-[12px]">{row.original.confirmation_number ?? '—'}</span>,
            },
            {
                accessorKey: 'remarks',
                header: () => <span>Remarks</span>,
                cell: ({ row }) => <span className="text-[13px]">{row.original.remarks ?? '—'}</span>,
            },
        ],
        [slOffset],
    );

    // eslint-disable-next-line react-hooks/incompatible-library
    const table = useReactTable({
        data: bookings.data,
        columns,
        getCoreRowModel: getCoreRowModel(),
        manualPagination: true,
        manualSorting: true,
        manualFiltering: true,
    });

    const exportHref = toUrl(reportExport({ query: params as any }));

    return (
        <PageLayout title="Check-in / Check-out Report" backHref={toUrl(dashboard())}>
            <Head title="Check-in / Check-out Report" />

            <div className="max-w-[1200px] mx-auto space-y-6">
                <div className="flex flex-col gap-4">
                    <div className="flex flex-col lg:flex-row lg:items-end gap-3">
                        <div className="flex-1">
                            <ListSearch value={q} onChange={setQ} placeholder="Search bookings..." />
                        </div>

                        <div className="flex flex-col sm:flex-row gap-2">
                            <Input type="date" value={checkInFrom} onChange={(e) => setCheckInFrom(e.target.value)} className="h-11 rounded-xl w-[180px]" />
                            <Input type="date" value={checkInTo} onChange={(e) => setCheckInTo(e.target.value)} className="h-11 rounded-xl w-[180px]" />
                        </div>

                        <Button asChild className="rounded-xl h-11">
                            <a href={exportHref}>
                                <Download className="size-4 mr-2" /> Export Excel
                            </a>
                        </Button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
                        <Select value={hotelId || 'all'} onValueChange={(v) => setHotelId(v === 'all' ? '' : v)}>
                            <SelectTrigger className="h-11 rounded-xl">
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
                            <SelectTrigger className="h-11 rounded-xl">
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
                            <SelectTrigger className="h-11 rounded-xl">
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
                            <SelectTrigger className="h-11 rounded-xl">
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

                        <div className="flex items-center justify-end gap-2">
                            <RowsPerPageSelect value={perPage} onChange={setPerPage} />
                        </div>
                    </div>
                </div>

                <div className="rounded-3xl border border-border/50 bg-card/40 backdrop-blur-xl shadow-lg overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-muted/30">
                                {table.getHeaderGroups().map((hg) => (
                                    <tr key={hg.id} className="border-b border-border/30">
                                        {hg.headers.map((header) => (
                                            <th key={header.id} className="text-left px-4 py-3 font-semibold">
                                                {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                                            </th>
                                        ))}
                                    </tr>
                                ))}
                            </thead>
                            <tbody>
                                {table.getRowModel().rows.map((row) => (
                                    <tr key={row.id} className="border-b border-border/30 last:border-0">
                                        {row.getVisibleCells().map((cell) => (
                                            <td key={cell.id} className="px-4 py-3 whitespace-nowrap">
                                                {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                                {bookings.data.length === 0 && (
                                    <tr>
                                        <td colSpan={columns.length} className="px-4 py-10 text-center text-muted-foreground">
                                            No bookings found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    <div className="p-4 border-t border-border/30">
                        <PaginationBar links={bookings.links} />
                    </div>
                </div>
            </div>
        </PageLayout>
    );
}

AdminBookingsReportIndex.layout = (page: React.ReactNode) => page;


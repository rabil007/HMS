import { Head, Link, router } from '@inertiajs/react';
import { flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table';
import type { ColumnDef } from '@tanstack/react-table';
import React from 'react';
import { PaginationBar } from '@/components/list/pagination-bar';
import { RowsPerPageSelect } from '@/components/list/rows-per-page-select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import PageLayout from '@/layouts/page-layout';
import { toUrl } from '@/lib/utils';
import { overview } from '@/routes';
import { show as showBooking } from '@/routes/bookings';

type Paged<T> = {
    data: T[];
    links: { url: string | null; label: string; active: boolean }[];
    meta: { current_page: number; per_page: number };
};

type MetricBooking = {
    id: number;
    public_id: string;
    guest_name: string | null;
    status: string;
    check_in_date: string | null;
    check_in_time: string | null;
    check_out_date: string | null;
    check_out_time: string | null;
    room_number: string | null;
    single_or_twin: string | null;
    confirmation_number: string | null;
    remarks: string | null;
    hotel: { name: string } | null;
    client: { name: string } | null;
    vessel: { name: string } | null;
    rank: { name: string } | null;
};

export default function OverviewMetric({
    metric,
    title,
    bookings,
    lookups,
    filters,
}: {
    metric: string;
    title: string;
    bookings: Paged<MetricBooking>;
    lookups: { hotels: Array<{ id: number; name: string }>; clients: Array<{ id: number; name: string }>; vessels: Array<{ id: number; name: string }>; ranks: Array<{ id: number; name: string }> };
    filters: {
        q?: string;
        status?: string;
        hotel_id?: number | null;
        client_id?: number | null;
        vessel_id?: number | null;
        rank_id?: number | null;
        date_from?: string;
        date_to?: string;
        per_page?: number;
    };
}) {
    const [q, setQ] = React.useState(filters.q ?? '');
    const [status, setStatus] = React.useState(filters.status ?? '');
    const [hotelId, setHotelId] = React.useState(filters.hotel_id ? String(filters.hotel_id) : '');
    const [clientId, setClientId] = React.useState(filters.client_id ? String(filters.client_id) : '');
    const [vesselId, setVesselId] = React.useState(filters.vessel_id ? String(filters.vessel_id) : '');
    const [rankId, setRankId] = React.useState(filters.rank_id ? String(filters.rank_id) : '');
    const [dateFrom, setDateFrom] = React.useState(filters.date_from ?? '');
    const [dateTo, setDateTo] = React.useState(filters.date_to ?? '');

    const applyFilters = () => {
        router.get(`/overview/metric/${metric}`, {
            q: q || undefined,
            status: status || undefined,
            hotel_id: hotelId || undefined,
            client_id: clientId || undefined,
            vessel_id: vesselId || undefined,
            rank_id: rankId || undefined,
            date_from: dateFrom || undefined,
            date_to: dateTo || undefined,
            per_page: filters.per_page ?? 15,
        }, { preserveScroll: true, preserveState: true });
    };

    const resetFilters = () => {
        router.get(`/overview/metric/${metric}`, { per_page: filters.per_page ?? 15 }, { preserveScroll: true, preserveState: true });
    };

    const columns = React.useMemo<ColumnDef<MetricBooking>[]>(
        () => [
            {
                accessorKey: 'guest_name',
                header: () => 'Guest name',
                cell: ({ row }) => row.original.guest_name ?? '—',
            },
            {
                id: 'rank',
                header: () => 'Rank',
                cell: ({ row }) => row.original.rank?.name ?? '—',
            },
            {
                accessorKey: 'check_in_date',
                header: () => 'Check-in Date',
                cell: ({ row }) => formatDate(row.original.check_in_date),
            },
            {
                accessorKey: 'check_in_time',
                header: () => 'Check-in Time',
                cell: ({ row }) => formatTime(row.original.check_in_time),
            },
            {
                accessorKey: 'check_out_date',
                header: () => 'Check-out Date',
                cell: ({ row }) => formatDate(row.original.check_out_date),
            },
            {
                accessorKey: 'check_out_time',
                header: () => 'Check-out Time',
                cell: ({ row }) => formatTime(row.original.check_out_time),
            },
            {
                id: 'vessel',
                header: () => 'Vessel',
                cell: ({ row }) => row.original.vessel?.name ?? '—',
            },
            {
                accessorKey: 'room_number',
                header: () => 'Room no.',
                cell: ({ row }) => row.original.room_number ?? '—',
            },
            {
                accessorKey: 'single_or_twin',
                header: () => 'Room type',
                cell: ({ row }) => row.original.single_or_twin ?? '—',
            },
            {
                accessorKey: 'confirmation_number',
                header: () => 'Booking confirmation',
                cell: ({ row }) => row.original.confirmation_number ?? '—',
            },
            {
                accessorKey: 'remarks',
                header: () => 'Remarks',
                cell: ({ row }) => row.original.remarks ?? '—',
            },
        ],
        [],
    );

    const table = useReactTable({
        data: bookings.data,
        columns,
        getCoreRowModel: getCoreRowModel(),
        manualPagination: true,
    });

    return (
        <PageLayout title={title} backHref={toUrl(overview())}>
            <Head title={title} />

            <div className="mb-6">
                <h2 className="text-xl font-bold text-foreground tracking-tight">{title}</h2>
                <p className="text-[13px] text-muted-foreground mt-1">Filtered booking list for this KPI.</p>
            </div>

            <div className="mb-6 rounded-2xl border border-border/60 bg-card/40 p-4">
                <div className="grid grid-cols-1 gap-3 md:grid-cols-3 lg:grid-cols-4">
                    <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search guest/ref/conf..." className="h-10" />

                    <Select value={status || 'all'} onValueChange={(value) => setStatus(value === 'all' ? '' : value)}>
                        <SelectTrigger className="h-10 w-full">
                            <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Statuses</SelectItem>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="confirmed">Confirmed</SelectItem>
                            <SelectItem value="rejected">Rejected</SelectItem>
                        </SelectContent>
                    </Select>

                    <Select value={hotelId || 'all'} onValueChange={(value) => setHotelId(value === 'all' ? '' : value)}>
                        <SelectTrigger className="h-10 w-full">
                            <SelectValue placeholder="Hotel" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Hotels</SelectItem>
                            {lookups.hotels.map((hotel) => (
                                <SelectItem key={hotel.id} value={String(hotel.id)}>{hotel.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Select value={clientId || 'all'} onValueChange={(value) => setClientId(value === 'all' ? '' : value)}>
                        <SelectTrigger className="h-10 w-full">
                            <SelectValue placeholder="Client" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Clients</SelectItem>
                            {lookups.clients.map((client) => (
                                <SelectItem key={client.id} value={String(client.id)}>{client.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Select value={vesselId || 'all'} onValueChange={(value) => setVesselId(value === 'all' ? '' : value)}>
                        <SelectTrigger className="h-10 w-full">
                            <SelectValue placeholder="Vessel" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Vessels</SelectItem>
                            {lookups.vessels.map((vessel) => (
                                <SelectItem key={vessel.id} value={String(vessel.id)}>{vessel.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Select value={rankId || 'all'} onValueChange={(value) => setRankId(value === 'all' ? '' : value)}>
                        <SelectTrigger className="h-10 w-full">
                            <SelectValue placeholder="Rank" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Ranks</SelectItem>
                            {lookups.ranks.map((rank) => (
                                <SelectItem key={rank.id} value={String(rank.id)}>{rank.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="h-10" />
                    <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="h-10" />
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                    <Button type="button" onClick={applyFilters} className="h-9 px-4">Apply Filters</Button>
                    <Button type="button" variant="outline" onClick={resetFilters} className="h-9 px-4">Reset</Button>
                </div>
            </div>

            <div className="rounded-2xl border border-border/60 bg-card/40 overflow-hidden">
                <div className="w-full overflow-x-auto">
                    <table className="w-full min-w-max text-sm">
                        <thead className="bg-muted/30">
                            {table.getHeaderGroups().map((headerGroup) => (
                                <tr key={headerGroup.id} className="border-b border-border/40">
                                    {headerGroup.headers.map((header) => (
                                        <th key={header.id} className="text-left px-4 py-3 font-semibold text-foreground whitespace-nowrap">
                                            {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                                        </th>
                                    ))}
                                </tr>
                            ))}
                        </thead>
                        <tbody>
                            {bookings.data.length === 0 ? (
                                <tr>
                                    <td colSpan={columns.length} className="px-4 py-10 text-center text-muted-foreground">
                                        No records found.
                                    </td>
                                </tr>
                            ) : (
                                table.getRowModel().rows.map((row) => (
                                    <tr key={row.id} className="border-b border-border/30 last:border-0 hover:bg-muted/20">
                                        {row.getVisibleCells().map((cell) => (
                                            <td key={cell.id} className="px-4 py-3 whitespace-nowrap">
                                                {cell.column.id === 'guest_name' ? (
                                                    <Link href={toUrl(showBooking({ booking: row.original.id }))} className="text-primary hover:underline">
                                                        {String(cell.getValue())}
                                                    </Link>
                                                ) : (
                                                    flexRender(cell.column.columnDef.cell, cell.getContext())
                                                )}
                                            </td>
                                        ))}
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {bookings.links?.length > 0 && (
                <PaginationBar
                    links={bookings.links}
                    onVisit={(url) => router.get(url, {}, { preserveScroll: true, preserveState: true })}
                    left={(
                        <RowsPerPageSelect
                            value={filters.per_page ?? 15}
                            onChange={(perPage) => {
                                router.get(window.location.pathname, { ...filters, per_page: perPage }, { preserveScroll: true, preserveState: true });
                            }}
                        />
                    )}
                />
            )}
        </PageLayout>
    );
}

OverviewMetric.layout = (page: React.ReactNode) => page;

function formatDate(value: string | null): string {
    if (!value) {
        return '—';
    }

    const parsed = new Date(value);

    if (Number.isNaN(parsed.getTime())) {
        return '—';
    }

    return parsed.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    });
}

function formatTime(value: string | null): string {
    if (!value) {
        return '—';
    }

    const parsed = new Date(`1970-01-01T${value}`);

    if (Number.isNaN(parsed.getTime())) {
        return value;
    }

    return parsed.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
    });
}

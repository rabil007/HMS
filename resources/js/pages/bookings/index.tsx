import { Head, Link, router } from '@inertiajs/react';
import { ArrowUpDown, Download, Eye, Pencil, Plus, Trash2 } from 'lucide-react';
import React from 'react';
import { useReactTable, getCoreRowModel, flexRender, type ColumnDef } from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import { ListSearch } from '@/components/list/list-search';
import { PaginationBar } from '@/components/list/pagination-bar';
import { RowsPerPageSelect } from '@/components/list/rows-per-page-select';
import PageLayout from '@/layouts/page-layout';
import { toUrl } from '@/lib/utils';
import { dashboard } from '@/routes';
import { create, destroy, edit, index as bookingsIndex, show } from '@/routes/bookings';
import { useIndexQueryParams } from '@/hooks/use-index-query-params';

type Paged<T> = {
    data: T[];
    links: { url: string | null; label: string; active: boolean }[];
    meta: { current_page: number; last_page: number; per_page: number; total: number };
};

export default function BookingsIndex({
    bookings,
    filters,
    counts,
    overallTotal,
}: {
    bookings: Paged<any>;
    filters: {
        q?: string;
        status?: string;
        column?: Record<string, string>;
        sort?: string;
        dir?: 'asc' | 'desc';
        per_page?: number;
    };
    counts: { total: number; pending: number; confirmed: number; cancelled: number };
    overallTotal: number;
}) {
    const fmt = (d: string) =>
        new Date(d).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });

    const { q, setQ, perPage, setPerPage, sort, dir, params, toggleSort } = useIndexQueryParams({
        href: bookingsIndex(),
        filters,
        defaultPerPage: 15,
    });
    const slOffset = ((bookings?.meta?.current_page ?? 1) - 1) * (bookings?.meta?.per_page ?? 10);

    const exportUrl = (format: 'csv' | 'xlsx' | 'pdf') => {
        const s = new URLSearchParams();
        if (params.q) s.set('q', params.q);
        if (params.sort) s.set('sort', params.sort);
        if (params.dir) s.set('dir', params.dir);
        if (params.per_page) s.set('per_page', String(params.per_page));
        return `/bookings/export/${format}?${s.toString()}`;
    };

    const columns = React.useMemo<ColumnDef<any>[]>(
        () => [
            {
                id: 'slno',
                header: () => (
                    <button type="button" className="inline-flex items-center gap-2" onClick={() => toggleSort('created_at')}>
                        Sl No. <ArrowUpDown className="size-4" />
                    </button>
                ),
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
            {
                accessorKey: 'status',
                header: () => <button type="button" className="inline-flex items-center gap-2" onClick={() => toggleSort('status')}>Status <ArrowUpDown className="size-4" /></button>,
                cell: ({ row }) => <span className="uppercase text-[12px]">{row.original.status}</span>,
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
                    <span className="text-[12px] text-muted-foreground">
                        {fmt(row.original.check_in_date)} → {row.original.check_out_date ? fmt(row.original.check_out_date) : 'Open'}
                    </span>
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
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if (confirm('Cancel this booking?')) {
                                        router.delete(toUrl(destroy({ booking: row.original.id })), { preserveScroll: true });
                                    }
                                }}
                                className="flex items-center justify-center h-8 w-8 rounded-lg text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
                            >
                                <Trash2 className="size-3.5" />
                            </button>
                        )}
                    </div>
                ),
            },
        ],
        [sort, dir, slOffset],
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
            <Head title="My Bookings" />

            {/* ── Top bar ────────────────────────── */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <div>
                    <h2 className="text-xl font-bold text-foreground tracking-tight">My Bookings</h2>
                    <p className="text-[13px] text-muted-foreground mt-0.5">Your hotel reservation history</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <Button
                        type="button"
                        variant="outline"
                        className="rounded-full px-3 sm:px-4 h-9 sm:h-10 text-[12px] sm:text-[14px]"
                        onClick={() => { window.location.href = exportUrl('csv'); }}
                    >
                        <Download className="size-3.5 sm:size-4 mr-1.5 sm:mr-2" /> CSV
                    </Button>
                    <Button
                        type="button"
                        variant="outline"
                        className="rounded-full px-3 sm:px-4 h-9 sm:h-10 text-[12px] sm:text-[14px]"
                        onClick={() => { window.location.href = exportUrl('xlsx'); }}
                    >
                        <Download className="size-3.5 sm:size-4 mr-1.5 sm:mr-2" /> Excel
                    </Button>
                    <Button
                        type="button"
                        variant="outline"
                        className="rounded-full px-3 sm:px-4 h-9 sm:h-10 text-[12px] sm:text-[14px]"
                        onClick={() => { window.location.href = exportUrl('pdf'); }}
                    >
                        <Download className="size-3.5 sm:size-4 mr-1.5 sm:mr-2" /> PDF
                    </Button>
                    <Button asChild className="rounded-full h-9 sm:h-10 px-4 text-[12px] sm:text-[14px]">
                        <Link href={toUrl(create())}><Plus className="size-3.5 sm:size-4 mr-1.5 sm:mr-2" /> New</Link>
                    </Button>
                </div>
            </div>

            {/* ── Stats pills ─────────────────────── */}
            {overallTotal > 0 && (
                <div className="flex gap-3 mb-6 flex-wrap items-center justify-between">
                    <div className="flex gap-3 flex-wrap">
                    {[
                        { label: 'Total',     value: counts.total,     cls: 'bg-muted/60 text-foreground'          },
                        { label: 'Pending',   value: counts.pending,   cls: 'bg-amber-400/10 text-amber-400'       },
                        { label: 'Confirmed', value: counts.confirmed, cls: 'bg-emerald-400/10 text-emerald-400'   },
                        { label: 'Cancelled', value: counts.cancelled, cls: 'bg-rose-400/10 text-rose-400'       },
                    ].map(({ label, value, cls }) => (
                        <div key={label} className={`inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-[12px] font-semibold ${cls}`}>
                            <span>{value}</span>
                            <span className="opacity-70">{label}</span>
                        </div>
                    ))}
                    </div>
                </div>
            )}

            {overallTotal > 0 && (
                <div className="mb-6">
                    <ListSearch
                        value={q}
                        onChange={setQ}
                        placeholder="Search hotel, guest, phone, email, reference…"
                    />
                </div>
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
                <div className="rounded-2xl border border-border/60 bg-card/40 overflow-hidden">
                    <div className="overflow-auto">
                        <table className="min-w-full text-sm">
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
                                            className="border-b border-border/30 last:border-0 hover:bg-muted/20 cursor-pointer"
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

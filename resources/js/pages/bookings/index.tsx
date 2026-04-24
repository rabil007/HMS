import { Head, Link, router } from '@inertiajs/react';
import { ArrowUpDown, Download, Pencil, Plus, Trash2 } from 'lucide-react';
import React from 'react';
import { useReactTable, getCoreRowModel, flexRender, type ColumnDef } from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import PageLayout from '@/layouts/page-layout';
import { toUrl } from '@/lib/utils';
import { dashboard } from '@/routes';
import { create, destroy, edit, index as bookingsIndex, show } from '@/routes/bookings';

type Paged<T> = {
    data: T[];
    links: { url: string | null; label: string; active: boolean }[];
    meta: { current_page: number; last_page: number; per_page: number; total: number };
};

export default function BookingsIndex({
    bookings,
    filters,
    counts,
}: {
    bookings: Paged<any>;
    filters: {
        q?: string;
        status?: string;
        column?: Record<string, string>;
        sort?: string;
        dir?: 'asc' | 'desc';
    };
    counts: { total: number; pending: number; confirmed: number; cancelled: number };
}) {
    const fmt = (d: string) =>
        new Date(d).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });

    const [q, setQ] = React.useState(filters?.q ?? '');
    const [status, setStatus] = React.useState<'all' | 'pending' | 'confirmed' | 'cancelled'>(
        (filters?.status as any) || 'all',
    );
    const [col, setCol] = React.useState<Record<string, string>>(filters?.column ?? {});
    const sort = filters?.sort || 'created_at';
    const dir: 'asc' | 'desc' = filters?.dir === 'asc' ? 'asc' : 'desc';

    React.useEffect(() => {
        const t = setTimeout(() => {
            router.get(
                toUrl(bookingsIndex()),
                {
                    q: q || undefined,
                    status: status === 'all' ? undefined : status,
                    filters: Object.keys(col).length ? col : undefined,
                    sort: sort || undefined,
                    dir: dir || undefined,
                },
                { preserveScroll: true, preserveState: true, replace: true },
            );
        }, 250);
        return () => clearTimeout(t);
    }, [q, status, col, sort, dir]);

    const toggleSort = (nextSort: string) => {
        const nextDir = sort === nextSort ? (dir === 'asc' ? 'desc' : 'asc') : 'asc';
        router.get(
            toUrl(bookingsIndex()),
            {
                q: q || undefined,
                status: status === 'all' ? undefined : status,
                filters: Object.keys(col).length ? col : undefined,
                sort: nextSort,
                dir: nextDir,
            },
            { preserveScroll: true, preserveState: true, replace: true },
        );
    };

    const exportUrl = (format: 'csv' | 'xlsx' | 'pdf') => {
        const params = new URLSearchParams();
        if (q) params.set('q', q);
        if (status !== 'all') params.set('status', status);
        Object.entries(col).forEach(([k, v]) => {
            if (v) params.set(`filters[${k}]`, v);
        });
        if (sort) params.set('sort', sort);
        if (dir) params.set('dir', dir);
        return `/bookings/export/${format}?${params.toString()}`;
    };

    const columns = React.useMemo<ColumnDef<any>[]>(
        () => [
            {
                accessorKey: 'public_id',
                header: () => (
                    <button type="button" className="inline-flex items-center gap-2" onClick={() => toggleSort('created_at')}>
                        Reference <ArrowUpDown className="size-4" />
                    </button>
                ),
                cell: ({ row }) => (
                    <Link href={toUrl(show({ booking: row.original.id }))} className="font-mono text-[12px] hover:underline">
                        {String(row.original.public_id).slice(0, 12)}
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
                header: () => <span>Dates</span>,
                cell: ({ row }) => (
                    <span className="text-[12px] text-muted-foreground">
                        {fmt(row.original.check_in_date)} → {row.original.check_out_date ? fmt(row.original.check_out_date) : 'Open'}
                    </span>
                ),
            },
            {
                id: 'actions',
                header: () => <span className="sr-only">Actions</span>,
                cell: ({ row }) => (
                    <div className="flex items-center justify-end gap-1">
                        <Link
                            href={toUrl(edit({ booking: row.original.id }))}
                            className="flex items-center justify-center h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
                            title="Edit booking"
                        >
                            <Pencil className="size-3.5" />
                        </Link>
                        {row.original.status === 'pending' && (
                            <button
                                type="button"
                                title="Cancel booking"
                                onClick={() => {
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
        [q, status, col, sort, dir],
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
            <div className="flex items-start justify-between gap-6 mb-8">
                <div>
                    <h2 className="text-xl font-bold text-foreground tracking-tight">My Bookings</h2>
                    <p className="text-[13px] text-muted-foreground mt-0.5">Your hotel reservation history</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        type="button"
                        variant="outline"
                        className="rounded-full"
                        onClick={() => { window.location.href = exportUrl('csv'); }}
                    >
                        <Download className="size-4 mr-2" /> CSV
                    </Button>
                    <Button
                        type="button"
                        variant="outline"
                        className="rounded-full"
                        onClick={() => { window.location.href = exportUrl('xlsx'); }}
                    >
                        <Download className="size-4 mr-2" /> Excel
                    </Button>
                    <Button
                        type="button"
                        variant="outline"
                        className="rounded-full"
                        onClick={() => { window.location.href = exportUrl('pdf'); }}
                    >
                        <Download className="size-4 mr-2" /> PDF
                    </Button>
                    <Button asChild className="rounded-full">
                        <Link href={toUrl(create())}><Plus className="size-4 mr-2" /> New</Link>
                    </Button>
                </div>
            </div>

            {/* ── Stats pills ─────────────────────── */}
            {counts.total > 0 && (
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

            {counts.total > 0 && (
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-6">
                    <div className="flex-1">
                        <Input
                            value={q}
                            onChange={(e) => setQ(e.target.value)}
                            placeholder="Search hotel, guest, phone, email, reference…"
                            className="h-11 rounded-xl border-border/60 bg-muted/40 text-[14px] px-4 focus:border-primary/60 focus:ring-2 focus:ring-primary/20 transition-all"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        {[
                            { key: 'all', label: 'All' },
                            { key: 'pending', label: 'Pending' },
                            { key: 'confirmed', label: 'Confirmed' },
                            { key: 'cancelled', label: 'Cancelled' },
                        ].map((opt) => (
                            <button
                                key={opt.key}
                                type="button"
                                onClick={() => setStatus(opt.key as any)}
                                className={[
                                    'h-11 px-4 rounded-xl border text-[13px] font-semibold transition-colors',
                                    status === opt.key
                                        ? 'border-primary bg-primary text-primary-foreground shadow-md shadow-primary/20'
                                        : 'border-border/60 bg-muted/40 text-muted-foreground hover:text-foreground hover:border-border',
                                ].join(' ')}
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* ── Empty ───────────────────────────── */}
            {counts.total === 0 && (
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
            {counts.total > 0 && bookings.data.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                    <p className="text-[15px] font-medium text-foreground">No results</p>
                    <p className="text-[13px] text-muted-foreground mt-1">Try a different search or clear filters.</p>
                </div>
            )}

            {bookings.data.length > 0 && (
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
                                <tr className="border-b border-border/40">
                                    <th className="px-4 py-2">
                                        <Input
                                            value={col.public_id ?? ''}
                                            onChange={(e) => setCol((p) => ({ ...p, public_id: e.target.value }))}
                                            placeholder="Filter ref…"
                                            className="h-9"
                                        />
                                    </th>
                                    <th className="px-4 py-2">
                                        <Input
                                            value={col.hotel_name ?? ''}
                                            onChange={(e) => setCol((p) => ({ ...p, hotel_name: e.target.value }))}
                                            placeholder="Filter hotel…"
                                            className="h-9"
                                        />
                                    </th>
                                    <th className="px-4 py-2" />
                                    <th className="px-4 py-2">
                                        <Input
                                            value={col.guest_name ?? ''}
                                            onChange={(e) => setCol((p) => ({ ...p, guest_name: e.target.value }))}
                                            placeholder="Filter guest…"
                                            className="h-9"
                                        />
                                    </th>
                                    <th className="px-4 py-2">
                                        <Input
                                            value={col.guest_email ?? ''}
                                            onChange={(e) => setCol((p) => ({ ...p, guest_email: e.target.value }))}
                                            placeholder="Filter email…"
                                            className="h-9"
                                        />
                                    </th>
                                    <th className="px-4 py-2" />
                                    <th className="px-4 py-2" />
                                </tr>
                            </thead>
                            <tbody>
                                {table.getRowModel().rows.map((row) => (
                                    <tr key={row.id} className="border-b border-border/30 last:border-0 hover:bg-muted/20">
                                        {row.getVisibleCells().map((cell) => (
                                            <td key={cell.id} className="px-4 py-3 align-middle whitespace-nowrap">
                                                {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {bookings.links?.length > 0 && (
                <div className="mt-6 flex flex-wrap items-center gap-2">
                    {bookings.links.map((l, idx) => (
                        <button
                            key={`${l.label}-${idx}`}
                            type="button"
                            disabled={!l.url || l.active}
                            onClick={() => l.url && router.get(l.url, {}, { preserveScroll: true, preserveState: true })}
                            className={[
                                'h-10 px-4 rounded-xl border text-[13px] font-semibold transition-colors',
                                l.active
                                    ? 'border-primary bg-primary text-primary-foreground'
                                    : 'border-border/60 bg-muted/40 text-muted-foreground hover:text-foreground hover:border-border',
                                !l.url ? 'opacity-50 cursor-not-allowed' : '',
                            ].join(' ')}
                            dangerouslySetInnerHTML={{ __html: l.label }}
                        />
                    ))}
                </div>
            )}
        </PageLayout>
    );
}

BookingsIndex.layout = (page: React.ReactNode) => page;

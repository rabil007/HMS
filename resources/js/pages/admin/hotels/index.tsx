import { Head, Link, router } from '@inertiajs/react';
import { ArrowUpDown, Eye, Pencil, Plus, Trash2 } from 'lucide-react';
import React from 'react';
import { flexRender, getCoreRowModel, type ColumnDef, useReactTable } from '@tanstack/react-table';
import { ListSearch } from '@/components/list/list-search';
import { PaginationBar } from '@/components/list/pagination-bar';
import { RowsPerPageSelect } from '@/components/list/rows-per-page-select';
import { Button } from '@/components/ui/button';
import PageLayout from '@/layouts/page-layout';
import { toUrl } from '@/lib/utils';
import { dashboard } from '@/routes';
import { create, destroy, edit, index as hotelsIndex, show } from '@/routes/admin/hotels';
import { useConfirmDialog } from '@/hooks/use-confirm-dialog';
import { useIndexQueryParams } from '@/hooks/use-index-query-params';

type Paged<T> = {
    data: T[];
    links: { url: string | null; label: string; active: boolean }[];
    meta: { current_page: number; last_page: number; per_page: number; total: number };
};

type HotelRow = { id: number; name: string };

export default function HotelsIndex({
    hotels,
    filters,
}: {
    hotels: Paged<HotelRow>;
    filters: { q?: string; sort?: string; dir?: 'asc' | 'desc'; per_page?: number };
}) {
    const { q, setQ, perPage, setPerPage, toggleSort } = useIndexQueryParams({
        href: hotelsIndex(),
        filters,
        defaultPerPage: 15,
    });

    const slOffset = ((hotels?.meta?.current_page ?? 1) - 1) * (hotels?.meta?.per_page ?? 15);

    const { requestConfirm, ConfirmDialog } = useConfirmDialog();

    const columns = React.useMemo<ColumnDef<HotelRow>[]>(
        () => [
            {
                id: 'slno',
                header: () => <span>Sl No.</span>,
                cell: ({ row }) => <span className="text-[13px] font-semibold">{slOffset + row.index + 1}</span>,
            },
            {
                accessorKey: 'name',
                header: () => (
                    <button type="button" className="inline-flex items-center gap-2" onClick={() => toggleSort('name')}>
                        Name <ArrowUpDown className="size-4" />
                    </button>
                ),
                cell: ({ row }) => <span className="font-medium">{row.original.name}</span>,
            },
            {
                id: 'actions',
                header: () => <span>Actions</span>,
                cell: ({ row }) => (
                    <div className="flex items-center justify-end gap-1">
                        <Link
                            href={toUrl(show({ hotel: row.original.id }))}
                            onClick={(e) => e.stopPropagation()}
                            className="flex items-center justify-center h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
                            title="View hotel"
                        >
                            <Eye className="size-3.5" />
                        </Link>
                        <Link
                            href={toUrl(edit({ hotel: row.original.id }))}
                            onClick={(e) => e.stopPropagation()}
                            className="flex items-center justify-center h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
                            title="Edit hotel"
                        >
                            <Pencil className="size-3.5" />
                        </Link>
                        <button
                            type="button"
                            title="Delete hotel"
                            onClick={async (e) => {
                                e.stopPropagation();
                                if (
                                    !(await requestConfirm({
                                        title: 'Delete this hotel?',
                                        description: 'This action cannot be undone.',
                                        confirmText: 'Delete',
                                        variant: 'destructive',
                                    }))
                                ) {
                                    return;
                                }
                                router.delete(toUrl(destroy({ hotel: row.original.id })), { preserveScroll: true });
                            }}
                            className="flex items-center justify-center h-8 w-8 rounded-lg text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
                        >
                            <Trash2 className="size-3.5" />
                        </button>
                    </div>
                ),
            },
        ],
        [slOffset, requestConfirm],
    );

    const table = useReactTable({
        data: hotels.data,
        columns,
        getCoreRowModel: getCoreRowModel(),
        manualPagination: true,
        manualSorting: true,
        manualFiltering: true,
    });

    return (
        <PageLayout title="Hotels" backHref={toUrl(dashboard())}>
            <ConfirmDialog />
            <Head title="Hotels" />

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <div>
                    <h2 className="text-xl font-bold text-foreground tracking-tight">Hotels</h2>
                    <p className="text-[13px] text-muted-foreground mt-0.5">Manage hotels on the platform.</p>
                </div>

                <Button asChild className="rounded-full h-9 sm:h-10 px-4 text-[12px] sm:text-[14px]">
                    <Link href={toUrl(create())}><Plus className="size-3.5 sm:size-4 mr-1.5 sm:mr-2" /> New Hotel</Link>
                </Button>
            </div>

            <div className="mb-6">
                <ListSearch value={q} onChange={setQ} placeholder="Search hotels…" />
            </div>

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
                            {hotels.data.length === 0 ? (
                                <tr className="border-b border-border/30 last:border-0">
                                    <td colSpan={columns.length} className="px-4 py-10 text-center">
                                        <p className="text-[15px] font-medium text-foreground">No results</p>
                                        <p className="text-[13px] text-muted-foreground mt-1">Try a different search.</p>
                                    </td>
                                </tr>
                            ) : (
                                table.getRowModel().rows.map((row) => (
                                    <tr
                                        key={row.id}
                                        onClick={() => router.get(toUrl(show({ hotel: row.original.id })))}
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

            {hotels.links?.length > 0 && (
                <PaginationBar
                    links={hotels.links}
                    onVisit={(url) => router.get(url, {}, { preserveScroll: true, preserveState: true })}
                    left={<RowsPerPageSelect value={perPage} onChange={setPerPage} />}
                />
            )}
        </PageLayout>
    );
}

HotelsIndex.layout = (page: React.ReactNode) => page;


import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import { Inbox, CheckCircle2, XCircle, Clock, ArrowRight, Hash, FileText, RefreshCw, Eye, Building2 } from 'lucide-react';
import React, { useMemo, useState } from 'react';
import { GlassCard } from '@/components/layout/glass-card';
import { SectionHeader } from '@/components/layout/section-header';
import { ListSearch } from '@/components/list/list-search';
import { PaginationBar } from '@/components/list/pagination-bar';
import { RowsPerPageSelect } from '@/components/list/rows-per-page-select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useIndexQueryParams } from '@/hooks/use-index-query-params';
import PageLayout from '@/layouts/page-layout';
import { cn, toUrl } from '@/lib/utils';
import { dashboard } from '@/routes';
import { approve, index as hotelBookingsIndex, reject, show as hotelBookingsShow } from '@/routes/hotel/bookings';

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
    remarks: string | null;
    created_at: string;
    user?: { id: number; name: string; email: string; client_id: number | null };
    client?: { id: number; name: string } | null;
    rank?: { id: number; name: string } | null;
    vessel?: { id: number; name: string } | null;
};

function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

export default function HotelBookingsIndex({
    bookings,
    filters,
    counts,
    today,
    clients,
}: {
    bookings: Paged<BookingRow>;
    filters: { q?: string; status?: string; column?: Record<string, string>; per_page?: number };
    counts: { total: number; pending: number; confirmed: number; rejected: number };
    today: { pending: number; inHouse: number };
    clients: Array<{ id: number; name: string }>;
}) {
    const page = usePage();

    const preservedQuery = useMemo(() => {
        const url = String(page.url ?? '');
        const params = new URLSearchParams(url.includes('?') ? url.split('?')[1] : '');

        const dir = params.get('dir') ?? (filters as any)?.dir ?? 'desc';
        const sort = params.get('sort') ?? (filters as any)?.sort ?? 'created_at';
        const per_page = params.get('per_page') ?? String(filters?.per_page ?? 15);

        return { dir, sort, per_page };
    }, [page.url, filters]);

    const [selected, setSelected] = useState<BookingRow | null>(null);
    const [actionType, setActionType] = useState<'approve' | 'reject' | null>(null);
    const [status, setStatus] = useState<'pending' | 'confirmed' | 'rejected'>(
        (filters.status === 'confirmed' || filters.status === 'rejected') ? (filters.status as any) : 'pending'
    );
    const [clientId, setClientId] = useState<string>(filters.column?.client_id ?? '');

    const extras = useMemo(
        () => ({
            status,
            'filters[client_id]': clientId || undefined,
        }),
        [status, clientId],
    );

    const { q, setQ, perPage, setPerPage } = useIndexQueryParams({
        href: hotelBookingsIndex(),
        filters,
        defaultPerPage: 15,
        extras,
    });
    const showReset = Boolean(q || clientId || status !== 'pending');

    const approveForm = useForm<{ confirmation_number: string; actual_check_in_date: string; actual_check_out_date: string; remarks: string }>({
        confirmation_number: '',
        actual_check_in_date: '',
        actual_check_out_date: '',
        remarks: '',
    });

    const rejectForm = useForm<{ remarks: string }>({
        remarks: '',
    });

    const openAction = (b: BookingRow, type: 'approve' | 'reject') => {
        setSelected(b);
        setActionType(type);

        if (type === 'approve') {
            approveForm.setData({
                confirmation_number: b.confirmation_number ?? '',
                actual_check_in_date: (b.actual_check_in_date ?? b.check_in_date)?.slice(0, 10) ?? '',
                actual_check_out_date: (b.actual_check_out_date ?? b.check_out_date)?.slice(0, 10) ?? '',
                remarks: b.remarks ?? '',
            });
            approveForm.clearErrors();
        } else {
            rejectForm.setData({ remarks: b.remarks ?? '' });
            rejectForm.clearErrors();
        }
    };

    const close = () => {
        setSelected(null);
        setActionType(null);
        approveForm.reset();
        rejectForm.reset();
    };


    const submitApprove = () => {
        if (!selected) {
            return;
        }

        approveForm.put(toUrl(approve({ booking: selected.id })), {
            preserveScroll: true,
            onSuccess: close,
        });
    };

    const submitReject = () => {
        if (!selected) {
            return;
        }

        rejectForm.put(toUrl(reject({ booking: selected.id })), {
            preserveScroll: true,
            onSuccess: close,
        });
    };


    return (
        <PageLayout title="Booking Inbox" backHref={toUrl(dashboard())}>
            <Head title="Booking Inbox" />

            <div className="mx-auto max-w-4xl space-y-8 pb-10">
                <SectionHeader
                    title="Booking Inbox"
                    subtitle="Review, approve, or reject incoming reservations."
                    icon={Inbox}
                    right={(
                        <Button asChild variant="outline" className="rounded-full px-5">
                            <Link href={page.url} preserveScroll preserveState replace>
                                <RefreshCw className="size-4 mr-2" /> Refresh
                            </Link>
                        </Button>
                    )}
                />

                {/* ── TODAY ───────────────────────────────────────────── */}
                <div className="grid grid-cols-2 gap-3">
                    <GlassCard level="inner" className="min-w-0 rounded-2xl p-4">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Pending</span>
                            <Clock className="size-4 text-warning" />
                        </div>
                        <div className="mt-2 text-2xl font-bold">{today.pending}</div>
                    </GlassCard>
                    <GlassCard level="inner" className="min-w-0 rounded-2xl p-4">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">In-house</span>
                            <Building2 className="size-4 text-info" />
                        </div>
                        <div className="mt-2 text-2xl font-bold">{today.inHouse}</div>
                    </GlassCard>
                </div>

                {/* ── SEARCH + FILTERS ────────────────────────────────── */}
                <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
                    <div className="w-full sm:flex-1">
                        <ListSearch value={q} onChange={setQ} placeholder="Search guest, email, phone, agency, reference…" />
                    </div>
                    <div className="w-full sm:w-[260px]">
                        <Select value={clientId || 'all'} onValueChange={(v) => setClientId(v === 'all' ? '' : v)}>
                            <SelectTrigger className="w-full rounded-xl bg-muted/30">
                                <SelectValue placeholder="All clients" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All clients</SelectItem>
                                {clients.map((c) => (
                                    <SelectItem key={c.id} value={String(c.id)}>
                                        {c.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    {showReset && (
                        <div className="flex items-center gap-2 sm:ml-auto">
                            <Button
                                type="button"
                                variant="outline"
                                className="rounded-xl px-4"
                                onClick={() => {
                                    setQ('');
                                    setClientId('');
                                    setStatus('pending');
                                    router.get(
                                        toUrl(hotelBookingsIndex()),
                                        { ...preservedQuery, status: 'pending' },
                                        { preserveScroll: true, preserveState: true, replace: true },
                                    );
                                }}
                            >
                                Reset
                            </Button>
                        </div>
                    )}
                </div>

                <div className="grid w-full min-w-0 grid-cols-3 gap-1 rounded-2xl border border-border/40 bg-muted/40 p-1 sm:gap-1.5 sm:p-1.5">
                    <button
                        type="button"
                        onClick={() => setStatus('pending')}
                        className={cn(
                            'flex min-h-11 min-w-0 flex-col items-center justify-center gap-0.5 rounded-xl px-1 py-2 text-center text-[11px] font-bold leading-tight transition-all sm:min-h-0 sm:flex-row sm:gap-2 sm:px-4 sm:py-2 sm:text-[13px]',
                            status === 'pending' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground',
                        )}
                    >
                        <span className="max-w-full wrap-break-word">Pending</span>
                        <Badge
                            className={cn(
                                'shrink-0 px-1.5 text-[10px] sm:px-2 sm:text-xs',
                                status === 'pending' ? 'bg-warning/20 text-warning' : 'bg-muted-foreground/20 text-muted-foreground',
                                'hover:bg-transparent',
                            )}
                        >
                            {counts.pending}
                        </Badge>
                    </button>
                    <button
                        type="button"
                        onClick={() => setStatus('confirmed')}
                        className={cn(
                            'flex min-h-11 min-w-0 flex-col items-center justify-center gap-0.5 rounded-xl px-1 py-2 text-center text-[11px] font-bold leading-tight transition-all sm:min-h-0 sm:flex-row sm:gap-2 sm:px-4 sm:py-2 sm:text-[13px]',
                            status === 'confirmed' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground',
                        )}
                    >
                        <span className="max-w-full wrap-break-word">Approved</span>
                        <Badge
                            className={cn(
                                'shrink-0 px-1.5 text-[10px] sm:px-2 sm:text-xs',
                                status === 'confirmed' ? 'bg-success/20 text-success' : 'bg-muted-foreground/20 text-muted-foreground',
                                'hover:bg-transparent',
                            )}
                        >
                            {counts.confirmed}
                        </Badge>
                    </button>
                    <button
                        type="button"
                        onClick={() => setStatus('rejected')}
                        className={cn(
                            'flex min-h-11 min-w-0 flex-col items-center justify-center gap-0.5 rounded-xl px-1 py-2 text-center text-[11px] font-bold leading-tight transition-all sm:min-h-0 sm:flex-row sm:gap-2 sm:px-4 sm:py-2 sm:text-[13px]',
                            status === 'rejected' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground',
                        )}
                    >
                        <span className="max-w-full wrap-break-word">Rejected</span>
                        <Badge
                            className={cn(
                                'shrink-0 px-1.5 text-[10px] sm:px-2 sm:text-xs',
                                status === 'rejected' ? 'bg-destructive/20 text-destructive' : 'bg-muted-foreground/20 text-muted-foreground',
                                'hover:bg-transparent',
                            )}
                        >
                            {counts.rejected}
                        </Badge>
                    </button>
                </div>

                {/* ── LISTING SECTION ───────────────────────────────── */}
                <GlassCard as="section" className="flex flex-col overflow-hidden min-h-128">
                    <div className="p-4 sm:p-6 flex-1 bg-background/20">
                        {bookings.data.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 h-full text-center opacity-60">
                                {status === 'pending' ? <CheckCircle2 className="size-12 mb-3 text-success" /> : <Inbox className="size-12 mb-3 text-muted-foreground" />}
                                <p className="text-sm font-medium">{status === 'pending' ? "You're all caught up!" : "No records found."}</p>
                                <p className="text-xs text-muted-foreground mt-1">There are no records to display.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 gap-4">
                                {bookings.data.map((b) => (
                                    <div
                                        key={b.id}
                                        onClick={() => router.get(toUrl(hotelBookingsShow({ booking: b.id })))}
                                        className="group flex flex-col p-5 rounded-2xl border border-border/40 bg-card hover:bg-muted/30 transition-all shadow-sm cursor-pointer"
                                    >
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="min-w-0 flex-1 group/title">
                                                <div className="font-bold text-base text-foreground truncate flex items-center gap-2 group-hover/title:text-primary transition-colors">
                                                    {b.guest_name ?? b.user?.name ?? 'Guest'}
                                                    <span className="px-2 py-0.5 rounded-md bg-muted text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
                                                        {b.single_or_twin || 'Unknown Room'}
                                                    </span>
                                                    {status !== 'pending' && (
                                                        <span className={`px-2 py-0.5 rounded-md text-[10px] uppercase font-bold tracking-wider
                                                            ${b.status === 'confirmed' ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'}
                                                        `}>
                                                            {b.status}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="text-xs text-muted-foreground mt-1 font-medium">
                                                    {b.client?.name ? `Agency: ${b.client.name}` : 'Agency: —'}
                                                </div>
                                                <div className="text-[12px] text-muted-foreground mt-2">
                                                    <Clock className="inline size-3 mr-1" /> {formatDate(b.check_in_date)} <ArrowRight className="inline size-3 mx-1" /> {b.check_out_date ? formatDate(b.check_out_date) : 'OPEN'}
                                                </div>
                                            </div>
                                            
                                            <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2 shrink-0">
                                                <Link
                                                    href={toUrl(hotelBookingsShow({ booking: b.id }))}
                                                    onClick={(e) => e.stopPropagation()}
                                                    className="flex items-center justify-center h-9 w-9 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
                                                    title="View details"
                                                >
                                                    <Eye className="size-4" />
                                                </Link>

                                                {status === 'pending' && (
                                                    <>
                                                        <Button
                                                            size="sm"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                openAction(b, 'approve');
                                                            }}
                                                            className="bg-success hover:bg-success/90 text-success-foreground shadow-sm w-full sm:w-auto"
                                                        >
                                                            <CheckCircle2 className="size-4 sm:mr-1.5" /> <span className="hidden sm:inline">Approve</span>
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                openAction(b, 'reject');
                                                            }}
                                                            className="text-destructive hover:bg-destructive/10 hover:text-destructive border-destructive/20 w-full sm:w-auto"
                                                        >
                                                            <XCircle className="size-4 sm:mr-1.5" /> <span className="hidden sm:inline">Reject</span>
                                                        </Button>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                        
                                        {(b.confirmation_number || b.remarks) && (
                                            <div className="mt-4 pt-3 border-t border-border/30 grid gap-2 bg-muted/20 p-3 rounded-xl">
                                                {b.confirmation_number && (
                                                    <div className="flex items-start gap-2 text-[13px]">
                                                        <Hash className="size-4 text-muted-foreground shrink-0 mt-0.5" />
                                                        <div><span className="font-semibold text-foreground">Confirmation:</span> <span className="text-muted-foreground">{b.confirmation_number}</span></div>
                                                    </div>
                                                )}
                                                {b.remarks && (
                                                    <div className="flex items-start gap-2 text-[13px]">
                                                        <FileText className="size-4 text-muted-foreground shrink-0 mt-0.5" />
                                                        <div><span className="font-semibold text-foreground">Remarks:</span> <span className="text-muted-foreground">{b.remarks}</span></div>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                    </div>
                                ))}
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

                {/* ── ACTION MODAL ────────────────────────────────────── */}
                {selected && actionType && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
                        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm transition-opacity" onClick={close} />
                        
                        <div className="relative w-full max-w-md rounded-3xl border border-border/60 bg-card shadow-2xl overflow-hidden flex flex-col max-h-full animate-in fade-in zoom-in-95 duration-200">
                            
                            {/* Modal Header */}
                            <div className={actionType === 'approve'
                                ? 'px-6 py-5 border-b border-border/40 bg-success text-success-foreground'
                                : 'px-6 py-5 border-b border-border/40 bg-destructive text-destructive-foreground'
                            }>
                                <h3 className="text-xl font-bold flex items-center gap-2">
                                    {actionType === 'approve' ? <CheckCircle2 className="size-6" /> : <XCircle className="size-6" />}
                                    {actionType === 'approve' ? 'Approve Booking' : 'Reject Booking'}
                                </h3>
                                <p className="text-white/80 text-sm mt-1">
                                    For {selected.guest_name ?? selected.user?.name ?? 'Guest'}
                                </p>
                            </div>

                            {/* Modal Body */}
                            <div className="p-6 overflow-y-auto">
                                <div className="bg-muted/50 rounded-xl p-4 mb-6 border border-border/50 text-sm grid gap-2">
                                    <div className="flex items-center justify-between">
                                            <span className="text-muted-foreground">Scheduled:</span>
                                        <span className="font-semibold">{formatDate(selected.check_in_date)} → {selected.check_out_date ? formatDate(selected.check_out_date) : 'OPEN'}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-muted-foreground">Room Type:</span>
                                        <span className="font-semibold uppercase text-xs tracking-wider">{selected.single_or_twin || 'N/A'}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-muted-foreground">Agency:</span>
                                        <span className="font-semibold">{selected.client?.name || 'N/A'}</span>
                                    </div>
                                </div>

                                {actionType === 'approve' ? (
                                    <div className="space-y-4">
                                        <div className="space-y-1.5">
                                            <label className="text-sm font-semibold text-foreground">Confirmation Number <span className="text-destructive">*</span></label>
                                            <Input
                                                value={approveForm.data.confirmation_number}
                                                onChange={(e) => approveForm.setData('confirmation_number', e.target.value)}
                                                placeholder="e.g. CNF-12345"
                                                className="rounded-xl"
                                                autoFocus
                                            />
                                            {approveForm.errors.confirmation_number && <p className="text-xs text-destructive">{approveForm.errors.confirmation_number}</p>}
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-sm font-semibold text-foreground">Actual Check-in <span className="text-destructive">*</span></label>
                                            <Input
                                                type="date"
                                                value={approveForm.data.actual_check_in_date}
                                                onChange={(e) => approveForm.setData('actual_check_in_date', e.target.value)}
                                                className="rounded-xl"
                                            />
                                            {approveForm.errors.actual_check_in_date && <p className="text-xs text-destructive">{approveForm.errors.actual_check_in_date}</p>}
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-sm font-semibold text-foreground">Actual Check-out <span className="text-muted-foreground font-normal">(Optional)</span></label>
                                            <Input
                                                type="date"
                                                value={approveForm.data.actual_check_out_date}
                                                onChange={(e) => approveForm.setData('actual_check_out_date', e.target.value)}
                                                className="rounded-xl"
                                            />
                                            {approveForm.errors.actual_check_out_date && <p className="text-xs text-destructive">{approveForm.errors.actual_check_out_date}</p>}
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-sm font-semibold text-foreground">Remarks <span className="text-muted-foreground font-normal">(Optional)</span></label>
                                            <textarea
                                                value={approveForm.data.remarks}
                                                onChange={(e) => approveForm.setData('remarks', e.target.value)}
                                                placeholder="Any notes for the agency?"
                                                className="min-h-24 w-full rounded-xl border border-input bg-background px-4 py-3 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary/50 transition-all"
                                            />
                                            {approveForm.errors.remarks && <p className="text-xs text-destructive">{approveForm.errors.remarks}</p>}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        <div className="space-y-1.5">
                                            <label className="text-sm font-semibold text-foreground">Rejection Reason <span className="text-destructive">*</span></label>
                                            <textarea
                                                value={rejectForm.data.remarks}
                                                onChange={(e) => rejectForm.setData('remarks', e.target.value)}
                                                placeholder="Please explain why this request is rejected..."
                                                className="min-h-32 w-full rounded-xl border border-input bg-background px-4 py-3 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-rose-500/50 transition-all"
                                                autoFocus
                                            />
                                            {rejectForm.errors.remarks && <p className="text-xs text-destructive">{rejectForm.errors.remarks}</p>}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Modal Footer */}
                            <div className="px-6 py-4 border-t border-border/40 bg-muted/20 flex items-center justify-end gap-3 mt-auto">
                                <Button variant="ghost" onClick={close} className="rounded-full hover:bg-muted">
                                    Cancel
                                </Button>
                                {actionType === 'approve' ? (
                                    <Button 
                                        onClick={submitApprove} 
                                        disabled={approveForm.processing}
                                        className="rounded-full bg-success hover:bg-success/90 text-success-foreground shadow-sm px-6"
                                    >
                                        {approveForm.processing ? 'Processing...' : 'Confirm Approval'}
                                    </Button>
                                ) : (
                                    <Button 
                                        onClick={submitReject} 
                                        disabled={rejectForm.processing}
                                        className="rounded-full bg-destructive hover:bg-destructive/90 text-destructive-foreground shadow-sm px-6"
                                    >
                                        {rejectForm.processing ? 'Processing...' : 'Confirm Rejection'}
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>
                )}

            </div>
        </PageLayout>
    );
}

HotelBookingsIndex.layout = (page: React.ReactNode) => page;


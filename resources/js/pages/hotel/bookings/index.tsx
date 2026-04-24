import { Head, Link, router, useForm } from '@inertiajs/react';
import React, { useMemo, useState } from 'react';
import PageLayout from '@/layouts/page-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toUrl } from '@/lib/utils';
import { dashboard } from '@/routes';
import { approve, index as hotelBookingsIndex, reject, show as hotelBookingsShow } from '@/routes/hotel/bookings';
import { Inbox, CheckCircle2, XCircle, Clock, ArrowRight, User, Hash, FileText, RefreshCw, Eye } from 'lucide-react';

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

export default function HotelBookingsIndex({ bookings }: { bookings: BookingRow[] }) {
    const [selected, setSelected] = useState<BookingRow | null>(null);
    const [actionType, setActionType] = useState<'approve' | 'reject' | null>(null);
    const [activeTab, setActiveTab] = useState<'pending' | 'confirmed' | 'cancelled'>('pending');

    const pending = useMemo(() => bookings.filter((b) => b.status === 'pending'), [bookings]);
    const confirmed = useMemo(() => bookings.filter((b) => b.status === 'confirmed'), [bookings]);
    const cancelled = useMemo(() => bookings.filter((b) => b.status === 'cancelled'), [bookings]);

    const activeList = useMemo(() => {
        if (activeTab === 'pending') return pending;
        if (activeTab === 'confirmed') return confirmed;
        return cancelled;
    }, [activeTab, pending, confirmed, cancelled]);

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
        if (!selected) return;
        approveForm.put(toUrl(approve({ booking: selected.id })), {
            preserveScroll: true,
            onSuccess: close,
        });
    };

    const submitReject = () => {
        if (!selected) return;
        rejectForm.put(toUrl(reject({ booking: selected.id })), {
            preserveScroll: true,
            onSuccess: close,
        });
    };


    return (
        <PageLayout title="Booking Inbox" backHref={toUrl(dashboard())}>
            <Head title="Booking Inbox" />

            <div className="max-w-[1000px] mx-auto space-y-8 pb-10">
                {/* ── HEADER ──────────────────────────────────────────── */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-indigo-500/10">
                            <Inbox className="size-6 text-indigo-500" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold tracking-tight text-foreground">Booking Inbox</h2>
                            <p className="text-muted-foreground text-sm">Review, approve, or reject incoming reservations.</p>
                        </div>
                    </div>
                    <Button asChild variant="outline" className="rounded-full px-5">
                        <a href={toUrl(hotelBookingsIndex())}>
                            <RefreshCw className="size-4 mr-2" /> Refresh
                        </a>
                    </Button>
                </div>

                {/* ── TABS ────────────────────────────────────────────── */}
                <div className="flex items-center gap-2 p-1.5 bg-muted/40 rounded-2xl border border-border/40 w-fit">
                    <button
                        onClick={() => setActiveTab('pending')}
                        className={`flex items-center gap-2 px-5 py-2 rounded-xl text-[13px] font-bold transition-all ${activeTab === 'pending' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                        Pending <Badge className={`${activeTab === 'pending' ? 'bg-amber-500/20 text-amber-500' : 'bg-muted-foreground/20 text-muted-foreground'} hover:bg-transparent`}>{pending.length}</Badge>
                    </button>
                    <button
                        onClick={() => setActiveTab('confirmed')}
                        className={`flex items-center gap-2 px-5 py-2 rounded-xl text-[13px] font-bold transition-all ${activeTab === 'confirmed' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                        Approved <Badge className={`${activeTab === 'confirmed' ? 'bg-emerald-500/20 text-emerald-500' : 'bg-muted-foreground/20 text-muted-foreground'} hover:bg-transparent`}>{confirmed.length}</Badge>
                    </button>
                    <button
                        onClick={() => setActiveTab('cancelled')}
                        className={`flex items-center gap-2 px-5 py-2 rounded-xl text-[13px] font-bold transition-all ${activeTab === 'cancelled' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                        Rejected <Badge className={`${activeTab === 'cancelled' ? 'bg-rose-500/20 text-rose-500' : 'bg-muted-foreground/20 text-muted-foreground'} hover:bg-transparent`}>{cancelled.length}</Badge>
                    </button>
                </div>

                {/* ── LISTING SECTION ───────────────────────────────── */}
                <section className="rounded-4xl border border-border/50 bg-card/40 backdrop-blur-xl flex flex-col shadow-lg overflow-hidden min-h-[500px]">
                    <div className="p-4 sm:p-6 flex-1 bg-background/20">
                        {activeList.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 h-full text-center opacity-60">
                                {activeTab === 'pending' ? <CheckCircle2 className="size-12 mb-3 text-emerald-500" /> : <Inbox className="size-12 mb-3 text-muted-foreground" />}
                                <p className="text-sm font-medium">{activeTab === 'pending' ? "You're all caught up!" : "No records found."}</p>
                                <p className="text-xs text-muted-foreground mt-1">There are no {activeTab} requests to display.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 gap-4">
                                {activeList.map((b) => (
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
                                                    {activeTab !== 'pending' && (
                                                        <span className={`px-2 py-0.5 rounded-md text-[10px] uppercase font-bold tracking-wider
                                                            ${b.status === 'confirmed' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}
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

                                                {activeTab === 'pending' && (
                                                    <>
                                                        <Button
                                                            size="sm"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                openAction(b, 'approve');
                                                            }}
                                                            className="bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm w-full sm:w-auto"
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
                                                            className="text-rose-500 hover:bg-rose-500/10 hover:text-rose-600 border-rose-500/20 w-full sm:w-auto"
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
                </section>

                {/* ── ACTION MODAL ────────────────────────────────────── */}
                {selected && actionType && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
                        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm transition-opacity" onClick={close} />
                        
                        <div className="relative w-full max-w-md rounded-4xl border border-border/60 bg-card shadow-2xl overflow-hidden flex flex-col max-h-full animate-in fade-in zoom-in-95 duration-200">
                            
                            {/* Modal Header */}
                            <div className={`px-6 py-5 border-b border-border/40 text-white ${actionType === 'approve' ? 'bg-emerald-500' : 'bg-rose-500'}`}>
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
                                            <label className="text-sm font-semibold text-foreground">Confirmation Number <span className="text-rose-500">*</span></label>
                                            <Input
                                                value={approveForm.data.confirmation_number}
                                                onChange={(e) => approveForm.setData('confirmation_number', e.target.value)}
                                                placeholder="e.g. CNF-12345"
                                                className="h-11 rounded-xl"
                                                autoFocus
                                            />
                                            {approveForm.errors.confirmation_number && <p className="text-xs text-rose-500">{approveForm.errors.confirmation_number}</p>}
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-sm font-semibold text-foreground">Actual Check-in <span className="text-rose-500">*</span></label>
                                            <Input
                                                type="date"
                                                value={approveForm.data.actual_check_in_date}
                                                onChange={(e) => approveForm.setData('actual_check_in_date', e.target.value)}
                                                className="h-11 rounded-xl"
                                            />
                                            {approveForm.errors.actual_check_in_date && <p className="text-xs text-rose-500">{approveForm.errors.actual_check_in_date}</p>}
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-sm font-semibold text-foreground">Actual Check-out <span className="text-muted-foreground font-normal">(Optional)</span></label>
                                            <Input
                                                type="date"
                                                value={approveForm.data.actual_check_out_date}
                                                onChange={(e) => approveForm.setData('actual_check_out_date', e.target.value)}
                                                className="h-11 rounded-xl"
                                            />
                                            {approveForm.errors.actual_check_out_date && <p className="text-xs text-rose-500">{approveForm.errors.actual_check_out_date}</p>}
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-sm font-semibold text-foreground">Remarks <span className="text-muted-foreground font-normal">(Optional)</span></label>
                                            <textarea
                                                value={approveForm.data.remarks}
                                                onChange={(e) => approveForm.setData('remarks', e.target.value)}
                                                placeholder="Any notes for the agency?"
                                                className="min-h-24 w-full rounded-xl border border-input bg-background px-4 py-3 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary/50 transition-all"
                                            />
                                            {approveForm.errors.remarks && <p className="text-xs text-rose-500">{approveForm.errors.remarks}</p>}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        <div className="space-y-1.5">
                                            <label className="text-sm font-semibold text-foreground">Rejection Reason <span className="text-rose-500">*</span></label>
                                            <textarea
                                                value={rejectForm.data.remarks}
                                                onChange={(e) => rejectForm.setData('remarks', e.target.value)}
                                                placeholder="Please explain why this request is rejected..."
                                                className="min-h-32 w-full rounded-xl border border-input bg-background px-4 py-3 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-rose-500/50 transition-all"
                                                autoFocus
                                            />
                                            {rejectForm.errors.remarks && <p className="text-xs text-rose-500">{rejectForm.errors.remarks}</p>}
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
                                        className="rounded-full bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm px-6"
                                    >
                                        {approveForm.processing ? 'Processing...' : 'Confirm Approval'}
                                    </Button>
                                ) : (
                                    <Button 
                                        onClick={submitReject} 
                                        disabled={rejectForm.processing}
                                        className="rounded-full bg-rose-500 hover:bg-rose-600 text-white shadow-sm px-6"
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


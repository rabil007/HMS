import { Head, useForm } from '@inertiajs/react';
import React, { useMemo, useState } from 'react';
import PageLayout from '@/layouts/page-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toUrl } from '@/lib/utils';
import { dashboard } from '@/routes';
import { approve, index as hotelBookingsIndex, reject } from '@/routes/hotel/bookings';
import { Inbox, CheckCircle2, XCircle, Clock, ArrowRight, User, Hash, FileText, RefreshCw } from 'lucide-react';

type BookingRow = {
    id: number;
    public_id: string;
    status: string;
    check_in_date: string;
    check_out_date: string | null;
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

    const pending = useMemo(() => bookings.filter((b) => b.status === 'pending'), [bookings]);
    const others = useMemo(() => bookings.filter((b) => b.status !== 'pending'), [bookings]);

    const approveForm = useForm<{ confirmation_number: string; remarks: string }>({
        confirmation_number: '',
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

            <div className="max-w-[1400px] mx-auto space-y-8 pb-10">
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

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* ── PENDING SECTION ───────────────────────────────── */}
                    <section className="rounded-[2rem] border border-border/50 bg-card/40 backdrop-blur-xl flex flex-col shadow-lg overflow-hidden h-[600px]">
                        <div className="px-6 py-5 border-b border-border/40 flex items-center justify-between bg-card/60 shrink-0">
                            <div className="flex items-center gap-2">
                                <Clock className="size-5 text-amber-500" />
                                <h3 className="text-base font-bold text-foreground">Needs Action</h3>
                            </div>
                            <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20 px-3 hover:bg-amber-500/20">{pending.length} Pending</Badge>
                        </div>
                        
                        <div className="p-4 flex-1 overflow-y-auto custom-scrollbar bg-background/20">
                            {pending.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-20 h-full text-center opacity-60">
                                    <CheckCircle2 className="size-12 mb-3 text-emerald-500" />
                                    <p className="text-sm font-medium">You're all caught up!</p>
                                    <p className="text-xs text-muted-foreground mt-1">No pending requests at the moment.</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {pending.map((b) => (
                                        <div key={b.id} className="group flex flex-col p-5 rounded-2xl border border-border/40 bg-card hover:bg-muted/30 transition-all shadow-sm">
                                            <div className="flex items-start justify-between gap-4 mb-3">
                                                <div className="min-w-0">
                                                    <div className="font-bold text-base text-foreground truncate flex items-center gap-2">
                                                        {b.guest_name ?? b.user?.name ?? 'Guest'}
                                                        <span className="px-2 py-0.5 rounded-md bg-muted text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
                                                            {b.single_or_twin || 'Unknown Room'}
                                                        </span>
                                                    </div>
                                                    <div className="text-xs text-muted-foreground mt-1 font-medium">
                                                        {b.client?.name ? `Agency: ${b.client.name}` : 'Agency: —'}
                                                    </div>
                                                </div>
                                                <div className="text-right shrink-0">
                                                    <div className="text-[13px] font-bold text-foreground">
                                                        {formatDate(b.check_in_date)}
                                                    </div>
                                                    <div className="text-[11px] text-muted-foreground uppercase font-bold mt-0.5">
                                                        {b.check_out_date ? `To ${formatDate(b.check_out_date)}` : 'Open End'}
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            <div className="flex flex-wrap items-center gap-2 mt-4 pt-4 border-t border-border/40">
                                                <Button 
                                                    size="sm" 
                                                    onClick={() => openAction(b, 'approve')}
                                                    className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm"
                                                >
                                                    <CheckCircle2 className="size-4 mr-1.5" /> Approve
                                                </Button>
                                                <Button 
                                                    size="sm" 
                                                    variant="outline"
                                                    onClick={() => openAction(b, 'reject')}
                                                    className="flex-1 text-rose-500 hover:bg-rose-500/10 hover:text-rose-600 border-rose-500/20"
                                                >
                                                    <XCircle className="size-4 mr-1.5" /> Reject
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </section>

                    {/* ── HISTORY SECTION ───────────────────────────────── */}
                    <section className="rounded-[2rem] border border-border/50 bg-card/40 backdrop-blur-xl flex flex-col shadow-lg overflow-hidden h-[600px]">
                        <div className="px-6 py-5 border-b border-border/40 flex items-center justify-between bg-card/60 shrink-0">
                            <div className="flex items-center gap-2">
                                <FileText className="size-5 text-muted-foreground" />
                                <h3 className="text-base font-bold text-foreground">Recent Decisions</h3>
                            </div>
                        </div>
                        
                        <div className="p-4 flex-1 overflow-y-auto custom-scrollbar bg-background/20">
                            {others.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-20 h-full text-center opacity-60">
                                    <Inbox className="size-10 mb-3 text-muted-foreground" />
                                    <p className="text-sm">No history yet.</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {others.slice(0, 25).map((b) => (
                                        <div key={b.id} className="flex flex-col p-4 rounded-2xl border border-border/40 bg-card shadow-sm opacity-80 hover:opacity-100 transition-opacity">
                                            <div className="flex items-start justify-between gap-4">
                                                <div className="min-w-0">
                                                    <div className="font-semibold text-[14px] text-foreground truncate">
                                                        {b.guest_name ?? b.user?.name ?? 'Guest'}
                                                    </div>
                                                    <div className="text-[12px] text-muted-foreground mt-0.5">
                                                        {formatDate(b.check_in_date)} <ArrowRight className="inline size-3 mx-1" /> {b.check_out_date ? formatDate(b.check_out_date) : 'OPEN'}
                                                    </div>
                                                </div>
                                                <span className={`shrink-0 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider
                                                    ${b.status === 'confirmed' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 
                                                      'bg-rose-500/10 text-rose-500 border border-rose-500/20'}
                                                `}>
                                                    {b.status}
                                                </span>
                                            </div>
                                            
                                            {(b.confirmation_number || b.remarks) && (
                                                <div className="mt-3 pt-3 border-t border-border/30 grid gap-1.5 bg-muted/20 p-2.5 rounded-xl">
                                                    {b.confirmation_number && (
                                                        <div className="flex items-start gap-2 text-[12px]">
                                                            <Hash className="size-3.5 text-muted-foreground shrink-0 mt-0.5" />
                                                            <div><span className="font-semibold text-foreground">Confirmation:</span> <span className="text-muted-foreground">{b.confirmation_number}</span></div>
                                                        </div>
                                                    )}
                                                    {b.remarks && (
                                                        <div className="flex items-start gap-2 text-[12px]">
                                                            <FileText className="size-3.5 text-muted-foreground shrink-0 mt-0.5" />
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
                </div>

                {/* ── ACTION MODAL ────────────────────────────────────── */}
                {selected && actionType && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
                        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm transition-opacity" onClick={close} />
                        
                        <div className="relative w-full max-w-md rounded-[2rem] border border-border/60 bg-card shadow-2xl overflow-hidden flex flex-col max-h-full animate-in fade-in zoom-in-95 duration-200">
                            
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
                                        <span className="text-muted-foreground">Dates:</span>
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


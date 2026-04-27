import { Head, Link, useForm } from '@inertiajs/react';
import { Anchor, ArrowLeft, Bed, Building2, CalendarDays, CheckCircle2, Clock, FileText, Hash, Mail, Pencil, Phone, ShieldCheck, User, XCircle } from 'lucide-react';
import React from 'react';
import { DetailHero } from '@/components/details/detail-hero';
import { DetailItem } from '@/components/details/detail-item';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import PageLayout from '@/layouts/page-layout';
import { toUrl } from '@/lib/utils';
import { approve, index as inboxIndex, reject } from '@/routes/hotel/bookings';

const STATUS = {
    pending: { color: 'bg-amber-500/10 text-amber-500 border-amber-500/20', label: 'Pending', icon: Clock },
    confirmed: { color: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20', label: 'Confirmed', icon: CheckCircle2 },
    rejected: { color: 'bg-rose-500/10 text-rose-500 border-rose-500/20', label: 'Rejected', icon: XCircle },
} as const;

export default function HotelBookingsShow({ booking }: { booking: any }) {
    const [actionType, setActionType] = React.useState<'approve' | 'reject' | null>(null);

    const approveForm = useForm<{ confirmation_number: string; actual_check_in_date: string; actual_check_out_date: string; remarks: string }>({
        confirmation_number: booking.confirmation_number ?? '',
        actual_check_in_date: (booking.actual_check_in_date ?? booking.check_in_date)?.slice(0, 10) ?? '',
        actual_check_out_date: (booking.actual_check_out_date ?? booking.check_out_date)?.slice(0, 10) ?? '',
        remarks: booking.remarks ?? '',
    });

    const rejectForm = useForm<{ remarks: string }>({
        remarks: booking.remarks ?? '',
    });

    const close = () => {
        setActionType(null);
        approveForm.reset();
        rejectForm.reset();
    };

    const submitApprove = () => {
        approveForm.put(toUrl(approve({ booking: booking.id })), {
            preserveScroll: true,
            onSuccess: close,
        });
    };

    const submitReject = () => {
        rejectForm.put(toUrl(reject({ booking: booking.id })), {
            preserveScroll: true,
            onSuccess: close,
        });
    };

    const fmt = (d: string) =>
        new Date(d).toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });

    const statusKey = String(booking.status ?? 'pending').toLowerCase() as keyof typeof STATUS;
    const s = STATUS[statusKey] ?? STATUS.pending;
    const StatusIcon = s.icon;

    const headerBadges = (
        <>
            <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[12px] font-semibold shadow-sm ${s.color}`}>
                <StatusIcon className="size-4" />
                {s.label}
            </span>
            <span className="flex items-center gap-1.5 font-mono text-[12px] font-medium text-muted-foreground/80 bg-muted/50 px-2.5 py-1 rounded-md border border-border/50">
                <Hash className="size-3" />
                {String(booking.public_id ?? booking.id)}
            </span>
        </>
    );

    const actions = (
        <>
            {String(booking.status).toLowerCase() === 'pending' ? (
                <>
                    <Button
                        type="button"
                        onClick={() => setActionType('approve')}
                        className="rounded-xl h-11 px-5 bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm"
                    >
                        <CheckCircle2 className="size-4 mr-2" />
                        Approve
                    </Button>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => setActionType('reject')}
                        className="rounded-xl h-11 px-5 text-rose-500 hover:bg-rose-500/10 hover:text-rose-600 border-rose-500/20"
                    >
                        <XCircle className="size-4 mr-2" />
                        Reject
                    </Button>
                </>
            ) : (
                <Link
                    href={toUrl(inboxIndex())}
                    className="inline-flex items-center justify-center gap-2 h-11 rounded-xl border border-border/60 bg-background/50 hover:bg-muted px-5 text-[14px] font-medium text-foreground transition-all shadow-sm hover:shadow"
                >
                    <ArrowLeft className="size-4" />
                    Back to Inbox
                </Link>
            )}
        </>
    );

    return (
        <PageLayout title="Booking Inbox Detail" backHref={toUrl(inboxIndex())}>
            <Head title="Booking Inbox Detail" />

            <div className="max-w-[1200px] mx-auto">
                <div className="space-y-8">
                    <DetailHero icon={Building2} title={booking.hotel?.name ?? 'Hotel'} badges={headerBadges} actions={actions} />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-4">
                            <h3 className="text-[13px] font-bold text-foreground uppercase tracking-widest flex items-center gap-2">
                                <CalendarDays className="size-4 text-primary" /> Stay Information
                            </h3>
                            <div className="grid gap-3">
                                <DetailItem icon={CalendarDays} label="Scheduled Check-in" value={booking.check_in_date ? fmt(booking.check_in_date) : null} />
                                <DetailItem icon={CalendarDays} label="Scheduled Check-out" value={booking.check_out_date ? fmt(booking.check_out_date) : 'Open / TBD'} />
                                <DetailItem icon={CalendarDays} label="Actual Check-in" value={booking.actual_check_in_date ? fmt(booking.actual_check_in_date) : '—'} />
                                <DetailItem icon={CalendarDays} label="Actual Check-out" value={booking.actual_check_out_date ? fmt(booking.actual_check_out_date) : (booking.actual_check_in_date ? 'OPEN' : '—')} />
                                <DetailItem icon={Bed} label="Room Type" value={booking.single_or_twin ? String(booking.single_or_twin) : null} />
                                <DetailItem icon={Hash} label="Confirmation #" value={booking.confirmation_number ?? null} />
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h3 className="text-[13px] font-bold text-foreground uppercase tracking-widest flex items-center gap-2">
                                <User className="size-4 text-primary" /> Guest Details
                            </h3>
                            <div className="grid gap-3">
                                <DetailItem icon={User} label="Full Name" value={booking.guest_name || booking.user?.name} />
                                <DetailItem icon={Mail} label="Email Address" value={booking.guest_email || booking.user?.email || 'Not provided'} />
                                <DetailItem icon={Phone} label="Phone Number" value={booking.guest_phone || 'Not provided'} />
                                <DetailItem icon={Building2} label="Agency" value={booking.client?.name ?? null} />
                            </div>
                        </div>

                        {(booking.rank || booking.vessel) && (
                            <div className="space-y-4 md:col-span-2">
                                <h3 className="text-[13px] font-bold text-foreground uppercase tracking-widest flex items-center gap-2">
                                    <Anchor className="size-4 text-primary" /> Assignment
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <DetailItem icon={ShieldCheck} label="Rank" value={booking.rank?.name ?? null} />
                                    <DetailItem icon={Anchor} label="Vessel" value={booking.vessel?.name ?? null} />
                                </div>
                            </div>
                        )}

                        {booking.remarks && (
                            <div className="space-y-4 md:col-span-2">
                                <h3 className="text-[13px] font-bold text-foreground uppercase tracking-widest flex items-center gap-2">
                                    <FileText className="size-4 text-primary" /> Remarks
                                </h3>
                                <div className="rounded-xl border border-border/40 bg-muted/20 p-4 text-[14px] text-foreground/90">
                                    {booking.remarks}
                                </div>
                            </div>
                        )}
                    </div>

                    {(booking.approved_at || booking.rejected_at) && (
                        <div className="rounded-4xl border border-border/50 bg-card/40 backdrop-blur-xl p-6 shadow-lg">
                            <div className="flex items-center justify-between gap-4 flex-wrap">
                                <div className="flex items-center gap-2">
                                    <Pencil className="size-4 text-muted-foreground" />
                                    <span className="text-sm font-semibold text-foreground">Decision</span>
                                </div>
                                {booking.approved_at && (
                                    <Badge className="bg-emerald-500/10 text-emerald-500 hover:bg-transparent">
                                        Approved{booking.approved_by ? ` by ${booking.approved_by.name}` : ''}
                                    </Badge>
                                )}
                                {booking.rejected_at && (
                                    <Badge className="bg-rose-500/10 text-rose-500 hover:bg-transparent">
                                        Rejected{booking.rejected_by ? ` by ${booking.rejected_by.name}` : ''}
                                    </Badge>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {actionType && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
                    <div className="absolute inset-0 bg-background/80 backdrop-blur-sm transition-opacity" onClick={close} />

                    <div className="relative w-full max-w-md rounded-4xl border border-border/60 bg-card shadow-2xl overflow-hidden flex flex-col max-h-full animate-in fade-in zoom-in-95 duration-200">
                        <div className={`px-6 py-5 border-b border-border/40 text-white ${actionType === 'approve' ? 'bg-emerald-500' : 'bg-rose-500'}`}>
                            <h3 className="text-xl font-bold flex items-center gap-2">
                                {actionType === 'approve' ? <CheckCircle2 className="size-6" /> : <XCircle className="size-6" />}
                                {actionType === 'approve' ? 'Approve Booking' : 'Reject Booking'}
                            </h3>
                            <p className="text-white/80 text-sm mt-1">For {booking.guest_name ?? booking.user?.name ?? 'Guest'}</p>
                        </div>

                        <div className="p-6 overflow-y-auto">
                            {actionType === 'approve' ? (
                                <div className="space-y-4">
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-semibold text-foreground">Confirmation Number</label>
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
                                        <label className="text-sm font-semibold text-foreground">Actual Check-in</label>
                                        <Input
                                            type="date"
                                            value={approveForm.data.actual_check_in_date}
                                            onChange={(e) => approveForm.setData('actual_check_in_date', e.target.value)}
                                            className="h-11 rounded-xl"
                                        />
                                        {approveForm.errors.actual_check_in_date && <p className="text-xs text-rose-500">{approveForm.errors.actual_check_in_date}</p>}
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-semibold text-foreground">Actual Check-out</label>
                                        <Input
                                            type="date"
                                            value={approveForm.data.actual_check_out_date}
                                            onChange={(e) => approveForm.setData('actual_check_out_date', e.target.value)}
                                            className="h-11 rounded-xl"
                                        />
                                        {approveForm.errors.actual_check_out_date && <p className="text-xs text-rose-500">{approveForm.errors.actual_check_out_date}</p>}
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-semibold text-foreground">Remarks</label>
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
                                <div className="space-y-1.5">
                                    <label className="text-sm font-semibold text-foreground">Rejection Reason</label>
                                    <textarea
                                        value={rejectForm.data.remarks}
                                        onChange={(e) => rejectForm.setData('remarks', e.target.value)}
                                        placeholder="Please explain why this request is rejected..."
                                        className="min-h-32 w-full rounded-xl border border-input bg-background px-4 py-3 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-rose-500/50 transition-all"
                                        autoFocus
                                    />
                                    {rejectForm.errors.remarks && <p className="text-xs text-rose-500">{rejectForm.errors.remarks}</p>}
                                </div>
                            )}
                        </div>

                        <div className="px-6 py-4 border-t border-border/40 bg-muted/20 flex items-center justify-end gap-3 mt-auto">
                            <Button variant="ghost" onClick={close} className="rounded-full hover:bg-muted">
                                Cancel
                            </Button>
                            {actionType === 'approve' ? (
                                <Button onClick={submitApprove} disabled={approveForm.processing} className="rounded-full bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm px-6">
                                    {approveForm.processing ? 'Processing...' : 'Confirm Approval'}
                                </Button>
                            ) : (
                                <Button onClick={submitReject} disabled={rejectForm.processing} className="rounded-full bg-rose-500 hover:bg-rose-600 text-white shadow-sm px-6">
                                    {rejectForm.processing ? 'Processing...' : 'Confirm Rejection'}
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </PageLayout>
    );
}

HotelBookingsShow.layout = (page: React.ReactNode) => page;


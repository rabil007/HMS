import { Head, Link, router } from '@inertiajs/react';
import {
    Building2, CalendarDays, CalendarCheck, CheckCircle2, Clock,
    DoorOpen, Hash, Mail, Pencil, Phone, Shield, Trash2,
    User, Anchor, ShieldCheck, Bed, XCircle, FileText
} from 'lucide-react';
import QRCode from 'qrcode';
import React from 'react';
import { ActivityLog } from '@/components/details/activity-log';
import { GlassCard } from '@/components/layout/glass-card';
import { useConfirmDialog } from '@/hooks/use-confirm-dialog';
import PageLayout from '@/layouts/page-layout';
import { toUrl } from '@/lib/utils';
import { index as bookingsIndex, edit, destroy } from '@/routes/bookings';

const STATUS = {
    pending:   { icon: Clock,        color: 'text-warning',     bg: 'bg-warning/10',     border: 'border-warning/20',     label: 'Pending'   },
    confirmed: { icon: CheckCircle2, color: 'text-success',     bg: 'bg-success/10',     border: 'border-success/20',     label: 'Confirmed' },
    rejected:  { icon: XCircle,      color: 'text-destructive', bg: 'bg-destructive/10', border: 'border-destructive/20', label: 'Rejected' },
} as const;

function fmtDt(v: string | null | undefined) {
    if (!v) {
return null;
}

    return new Date(v).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function StatusTimeline({ booking }: { booking: any }) {
    type Step = {
        key: string;
        icon: React.ElementType;
        label: string;
        sub?: string | null;
        done: boolean;
        active: boolean;
        skipped?: boolean;
    };

    const isRejected = booking.status === 'rejected';
    const isConfirmed = booking.status === 'confirmed' || (booking.approved_at !== undefined && booking.approved_at !== null);
    const isCheckedIn = !!booking.guest_check_in;
    const isCheckedOut = !!booking.guest_check_out;

    const steps: Step[] = [
        {
            key: 'requested',
            icon: CalendarDays,
            label: 'Request Submitted',
            sub: fmtDt(booking.created_at),
            done: true,
            active: booking.status === 'pending',
        },
        {
            key: 'confirmed',
            icon: isRejected ? XCircle : Shield,
            label: isRejected ? 'Rejected' : 'Hotel Confirmed',
            sub: isRejected
                ? fmtDt(booking.rejected_at)
                : fmtDt(booking.approved_at),
            done: isConfirmed || isRejected,
            active: false,
            skipped: isRejected,
        },
        {
            key: 'checkin',
            icon: DoorOpen,
            label: 'Checked In',
            sub: fmtDt(booking.guest_check_in),
            done: isCheckedIn,
            active: isConfirmed && !isCheckedIn && !isRejected,
            skipped: isRejected,
        },
        {
            key: 'checkout',
            icon: CalendarCheck,
            label: 'Checked Out',
            sub: fmtDt(booking.guest_check_out),
            done: isCheckedOut,
            active: isCheckedIn && !isCheckedOut,
            skipped: isRejected,
        },
    ];

    return (
        <div className="rounded-2xl border border-border/50 bg-card/50 p-5 shadow-sm">
            <h3 className="mb-5 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                Booking Progress
            </h3>
            <div className="relative">
                {steps.map((step, idx) => {
                    const Icon = step.icon;
                    const isLast = idx === steps.length - 1;

                    return (
                        <div key={step.key} className="flex gap-4">
                            <div className="flex flex-col items-center">
                                <div
                                    className={`flex size-9 shrink-0 items-center justify-center rounded-full border-2 transition-all ${
                                        step.skipped
                                            ? 'border-border/30 bg-background'
                                            : step.done
                                            ? step.key === 'confirmed' && isRejected
                                                ? 'border-destructive/50 bg-destructive/10'
                                                : 'border-success/50 bg-success/10'
                                            : step.active
                                            ? 'border-primary bg-primary/10 shadow-sm shadow-primary/20'
                                            : 'border-border/40 bg-background'
                                    }`}
                                >
                                    <Icon
                                        className={`size-4 ${
                                            step.skipped
                                                ? 'text-muted-foreground/30'
                                                : step.done
                                                ? step.key === 'confirmed' && isRejected
                                                    ? 'text-destructive'
                                                    : 'text-success'
                                                : step.active
                                                ? 'text-primary'
                                                : 'text-muted-foreground/40'
                                        }`}
                                    />
                                </div>
                                {!isLast && (
                                    <div
                                        className={`mt-1 mb-1 w-0.5 flex-1 min-h-[20px] rounded-full ${
                                            step.done && !step.skipped ? 'bg-success/40' : 'bg-border/30'
                                        }`}
                                    />
                                )}
                            </div>
                            <div className={`pb-4 pt-1 ${isLast ? '' : ''}`}>
                                <div
                                    className={`text-sm font-semibold ${
                                        step.skipped
                                            ? 'text-muted-foreground/40'
                                            : step.done
                                            ? step.key === 'confirmed' && isRejected
                                                ? 'text-destructive'
                                                : 'text-foreground'
                                            : step.active
                                            ? 'text-foreground'
                                            : 'text-muted-foreground/50'
                                    }`}
                                >
                                    {step.label}
                                </div>
                                {step.sub && !step.skipped && (
                                    <div className="mt-0.5 text-[11px] text-muted-foreground">{step.sub}</div>
                                )}
                                {step.active && (
                                    <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
                                        <span className="size-1.5 rounded-full bg-primary animate-pulse" />
                                        Current step
                                    </span>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

function DetailItem({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value?: string | null }) {
    if (!value) {
return null;
}

    return (
        <div className="flex flex-col gap-1.5 p-4 rounded-xl bg-muted/30 border border-border/40">
            <div className="flex items-center gap-2 text-muted-foreground">
                <Icon className="size-3.5" />
                <span className="text-[11px] font-semibold uppercase tracking-widest">{label}</span>
            </div>
            <div className="text-[14px] font-medium text-foreground ml-5.5">
                {value}
            </div>
        </div>
    );
}

export default function BookingsShow({
    booking,
    activities,
    qrValue,
    activityLookups,
}: {
    booking: any;
    activities?: any[];
    qrValue?: string | null;
    activityLookups?: { users?: Record<string, string> };
}) {
    const { requestConfirm, ConfirmDialog } = useConfirmDialog();
    const [qrDataUrl, setQrDataUrl] = React.useState<string | null>(null);

    const fmt = (d: string) =>
        new Date(d).toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });

    const s = STATUS[booking.status as keyof typeof STATUS] ?? STATUS.pending;
    const StatusIcon = s.icon;

    const handleDelete = async () => {
        if (
            !(await requestConfirm({
                title: 'Cancel this booking?',
                description: 'This cannot be undone.',
                confirmText: 'Cancel booking',
                variant: 'destructive',
            }))
        ) {
            return;
        }

        router.delete(toUrl(destroy({ booking: booking.id })));
    };

    const generateQr = async () => {
        if (!qrValue) {
return;
}

        const dataUrl = await QRCode.toDataURL(qrValue, { width: 512, margin: 2 });
        setQrDataUrl(dataUrl);
        const a = document.createElement('a');
        a.href = dataUrl;
        a.download = `booking-${String(booking.public_id ?? booking.id)}-qr.png`;
        a.click();
    };

    return (
        <PageLayout title="Booking Detail" backHref={toUrl(bookingsIndex())}>
            <ConfirmDialog />
            <Head title={`Booking — ${booking.hotel?.name}`} />

            <div>
                <div className="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-8">
                    
                    {/* ── LEFT COLUMN: DETAILS ──────────────────────────────────────── */}
                    <div className="space-y-8">
                        {/* Header Banner */}
                        <div className="relative overflow-hidden rounded-3xl border border-border/50 bg-card/60 backdrop-blur-xl p-8 shadow-lg">
                            {/* Subtle background glow */}
                            <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
                            
                            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                                <div className="flex items-center gap-5">
                                    <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-linear-to-br from-primary/20 to-primary/5 border border-primary/20 shadow-inner">
                                        <Building2 className="size-8 text-primary" />
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-bold text-foreground tracking-tight">
                                            {booking.hotel?.name}
                                        </h2>
                                        <div className="flex items-center gap-3 mt-2">
                                            <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[12px] font-semibold shadow-sm ${s.bg} ${s.border} ${s.color}`}>
                                                <StatusIcon className="size-4" />
                                                {s.label}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex w-full items-center justify-between gap-3 md:w-auto md:justify-start">
                                    <Link
                                        href={toUrl(edit({ booking: booking.id }))}
                                        className="inline-flex items-center justify-center gap-2 h-11 rounded-xl border border-border/60 bg-background/50 hover:bg-muted px-5 text-[14px] font-medium text-foreground transition-all shadow-sm hover:shadow"
                                    >
                                        <Pencil className="size-4" />
                                        Edit
                                    </Link>
                                    {qrValue && (
                                        <button
                                            type="button"
                                            onClick={generateQr}
                                            className="inline-flex items-center justify-center gap-2 h-11 rounded-xl border border-border/60 bg-background/50 hover:bg-muted px-5 text-[14px] font-medium text-foreground transition-all shadow-sm hover:shadow"
                                        >
                                            <Hash className="size-4" />
                                            Download QR
                                        </button>
                                    )}
                                    {booking.status === 'pending' && (
                                        <button
                                            type="button"
                                            onClick={handleDelete}
                                            className="inline-flex items-center justify-center gap-2 h-11 rounded-xl border border-destructive/30 bg-destructive/10 hover:bg-destructive/20 px-5 text-[14px] font-medium text-destructive transition-all shadow-sm hover:shadow"
                                        >
                                            <Trash2 className="size-4" />
                                            Cancel
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Status Timeline */}
                        <StatusTimeline booking={booking} />

                        {/* Detailed Information */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* Stay Details */}
                            <div className="space-y-4">
                                <h3 className="text-[13px] font-bold text-foreground uppercase tracking-widest flex items-center gap-2">
                                    <CalendarDays className="size-4 text-primary" /> Stay Information
                                </h3>
                                <div className="grid gap-3">
                                    <DetailItem icon={CalendarDays} label="Scheduled Check-in" value={booking.check_in_date ? fmt(booking.check_in_date) : null} />
                                    <DetailItem icon={CalendarDays} label="Scheduled Check-out" value={booking.check_out_date ? fmt(booking.check_out_date) : 'Open / TBD'} />
                                    <DetailItem icon={Bed} label="Room Type" value={booking.single_or_twin ? booking.single_or_twin.charAt(0).toUpperCase() + booking.single_or_twin.slice(1) : null} />
                                    <DetailItem icon={Hash} label="Room no." value={booking.room_number ?? null} />
                                    <DetailItem icon={Hash} label="Confirmation #" value={booking.confirmation_number ?? null} />
                                </div>
                            </div>

                            {/* Guest Details */}
                            <div className="space-y-4">
                                <h3 className="text-[13px] font-bold text-foreground uppercase tracking-widest flex items-center gap-2">
                                    <User className="size-4 text-primary" /> Guest Details
                                </h3>
                                <div className="grid gap-3">
                                    <DetailItem icon={User} label="Full Name" value={booking.guest_name || booking.user?.name} />
                                    <DetailItem icon={Mail} label="Email Address" value={booking.guest_email || booking.user?.email || 'Not provided'} />
                                    <DetailItem icon={Phone} label="Phone Number" value={booking.guest_phone || 'Not provided'} />
                                </div>
                            </div>

                            {/* Assignment Details */}
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

                        {qrDataUrl && (
                            <GlassCard className="p-6">
                                <h3 className="text-[13px] font-bold text-foreground uppercase tracking-widest">QR Preview</h3>
                                <div className="mt-4 flex items-center justify-center">
                                    <img src={qrDataUrl} alt="Booking QR" className="h-56 w-56 rounded-2xl border border-border/50 bg-background p-3" />
                                </div>
                            </GlassCard>
                        )}

                    </div>

                    {/* ── RIGHT COLUMN: ACTIVITY TIMELINE ──────────────────────────── */}
                    <aside className="relative">
                        <ActivityLog activities={activities} lookups={activityLookups} />
                    </aside>
                </div>
            </div>

        </PageLayout>
    );
}

BookingsShow.layout = (page: React.ReactNode) => page;

import { Head, Link, router, useForm } from '@inertiajs/react';
import {
    ArrowLeft, Building2, CalendarDays, Pencil, Trash2,
    Phone, User, Anchor, ShieldCheck, Bed, Clock, CheckCircle2, XCircle, Hash, ChevronDown, ChevronUp, Activity, Mail
} from 'lucide-react';
import React from 'react';
import { useConfirmDialog } from '@/hooks/use-confirm-dialog';
import PageLayout from '@/layouts/page-layout';
import { toUrl } from '@/lib/utils';
import { index as bookingsIndex, edit, destroy } from '@/routes/bookings';

const STATUS = {
    pending:   { icon: Clock,        color: 'text-amber-500 dark:text-amber-400',   bg: 'bg-amber-500/10 dark:bg-amber-400/10',   border: 'border-amber-500/20 dark:border-amber-400/20',   label: 'Pending'   },
    confirmed: { icon: CheckCircle2, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-600/10 dark:bg-emerald-400/10', border: 'border-emerald-600/20 dark:border-emerald-400/20', label: 'Confirmed' },
    cancelled: { icon: XCircle,      color: 'text-rose-500 dark:text-rose-400',    bg: 'bg-rose-500/10 dark:bg-rose-400/10',    border: 'border-rose-500/20 dark:border-rose-400/20',    label: 'Cancelled' },
} as const;

function DetailItem({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value?: string | null }) {
    if (!value) return null;
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

export default function BookingsShow({ booking, activities }: { booking: any; activities?: any[] }) {
    const [expanded, setExpanded] = React.useState<Record<number, boolean>>({});
    const { requestConfirm, ConfirmDialog } = useConfirmDialog();

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

    return (
        <PageLayout title="Booking Detail" backHref={toUrl(bookingsIndex())}>
            <ConfirmDialog />
            <Head title={`Booking — ${booking.hotel?.name}`} />

            <div className="max-w-[1200px] mx-auto">
                <div className="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-8">
                    
                    {/* ── LEFT COLUMN: DETAILS ──────────────────────────────────────── */}
                    <div className="space-y-8">
                        {/* Header Banner */}
                        <div className="relative overflow-hidden rounded-[2rem] border border-border/50 bg-card/60 backdrop-blur-xl p-8 shadow-lg">
                            {/* Subtle background glow */}
                            <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
                            
                            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                                <div className="flex items-center gap-5">
                                    <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 shadow-inner">
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
                                            <span className="flex items-center gap-1.5 font-mono text-[12px] font-medium text-muted-foreground/80 bg-muted/50 px-2.5 py-1 rounded-md border border-border/50">
                                                <Hash className="size-3" />
                                                {booking.public_id?.toUpperCase()}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    <Link
                                        href={toUrl(edit({ booking: booking.id }))}
                                        className="inline-flex items-center justify-center gap-2 h-11 rounded-xl border border-border/60 bg-background/50 hover:bg-muted px-5 text-[14px] font-medium text-foreground transition-all shadow-sm hover:shadow"
                                    >
                                        <Pencil className="size-4" />
                                        Edit
                                    </Link>
                                    {booking.status === 'pending' && (
                                        <button
                                            type="button"
                                            onClick={handleDelete}
                                            className="inline-flex items-center justify-center gap-2 h-11 rounded-xl border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 px-5 text-[14px] font-medium text-rose-500 transition-all shadow-sm hover:shadow"
                                        >
                                            <Trash2 className="size-4" />
                                            Cancel
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>

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
                                    <DetailItem icon={CalendarDays} label="Actual Check-in" value={booking.actual_check_in_date ? fmt(booking.actual_check_in_date) : '—'} />
                                    <DetailItem icon={CalendarDays} label="Actual Check-out" value={booking.actual_check_out_date ? fmt(booking.actual_check_out_date) : (booking.actual_check_in_date ? 'OPEN' : '—')} />
                                    <DetailItem icon={Bed} label="Room Type" value={booking.single_or_twin ? booking.single_or_twin.charAt(0).toUpperCase() + booking.single_or_twin.slice(1) : null} />
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
                        </div>

                    </div>

                    {/* ── RIGHT COLUMN: ACTIVITY TIMELINE ──────────────────────────── */}
                    <aside className="relative">
                        <div className="sticky top-24 rounded-[2rem] border border-border/50 bg-card/40 backdrop-blur-xl shadow-lg overflow-hidden flex flex-col max-h-[calc(100vh-8rem)]">
                            <div className="px-6 py-5 border-b border-border/40 bg-card/60 flex items-center justify-between">
                                <h3 className="text-[14px] font-bold text-foreground flex items-center gap-2">
                                    <Activity className="size-4 text-primary" /> Activity Log
                                </h3>
                                <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[11px] font-bold">
                                    {(activities ?? []).length}
                                </span>
                            </div>
                            
                            <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
                                {(activities ?? []).length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-10 text-center opacity-50">
                                        <Activity className="size-8 mb-3" />
                                        <p className="text-sm">No recent activity.</p>
                                    </div>
                                ) : (
                                    <div className="relative border-l border-border/60 ml-3 space-y-8 pb-4">
                                        {(activities ?? []).map((a: any, index: number) => {
                                            const isExpanded = expanded[a.id];
                                            const hasChanges = a.changes?.attributes && Object.keys(a.changes.attributes).length > 0;
                                            
                                            return (
                                                <div key={a.id} className="relative pl-6 group">
                                                    {/* Timeline Dot */}
                                                    <span className="absolute -left-[5px] top-1.5 h-2.5 w-2.5 rounded-full bg-primary ring-4 ring-background" />
                                                    
                                                    <div className="flex flex-col gap-1">
                                                        <div className="flex items-center justify-between gap-4">
                                                            <span className="text-[14px] font-semibold text-foreground capitalize">
                                                                {a.description || a.event}
                                                            </span>
                                                            <span className="text-[11px] font-medium text-muted-foreground whitespace-nowrap">
                                                                {new Date(a.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                                            </span>
                                                        </div>
                                                        
                                                        <div className="text-[12px] text-muted-foreground flex items-center justify-between">
                                                            <span>By <strong className="text-foreground/80 font-medium">{a.causer || 'System'}</strong></span>
                                                            
                                                            {hasChanges && (
                                                                <button
                                                                    onClick={() => setExpanded(p => ({ ...p, [a.id]: !p[a.id] }))}
                                                                    className="flex items-center gap-1 text-[11px] font-medium text-primary hover:text-primary/80 transition-colors"
                                                                >
                                                                    {isExpanded ? 'Hide changes' : 'View changes'}
                                                                    {isExpanded ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />}
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* Expandable Changes Box */}
                                                    {hasChanges && isExpanded && (
                                                        <div className="mt-3 rounded-xl border border-border/40 bg-background/50 p-3 shadow-inner">
                                                            <div className="space-y-2">
                                                                {Object.entries(a.changes.attributes as Record<string, any>).map(([key, next]) => {
                                                                    const prev = a.changes?.old?.[key];
                                                                    const from = prev === undefined ? '—' : String(prev);
                                                                    const to = next === undefined ? '—' : String(next);
                                                                    return (
                                                                        <div key={key} className="flex flex-col gap-0.5">
                                                                            <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">{key.replace('_', ' ')}</span>
                                                                            <div className="flex items-center gap-2 text-[12px]">
                                                                                <span className="text-muted-foreground line-through decoration-rose-500/50 truncate max-w-[45%]">{from}</span>
                                                                                <span className="text-muted-foreground/40">→</span>
                                                                                <span className="text-emerald-500 dark:text-emerald-400 font-medium truncate max-w-[45%]">{to}</span>
                                                                            </div>
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>
                    </aside>
                </div>
            </div>

        </PageLayout>
    );
}

BookingsShow.layout = (page: React.ReactNode) => page;

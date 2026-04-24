import { Head, Link, router } from '@inertiajs/react';
import {
    ArrowLeft, Building2, CalendarDays, Pencil, Trash2,
    Phone, User, Anchor, ShieldCheck, Bed, Clock, CheckCircle2, XCircle, Hash, ChevronDown, ChevronUp,
} from 'lucide-react';
import React from 'react';
import PageLayout from '@/layouts/page-layout';
import { toUrl } from '@/lib/utils';
import { index as bookingsIndex, edit, destroy } from '@/routes/bookings';

const STATUS = {
    pending:   { icon: Clock,        color: 'text-amber-400',   bg: 'bg-amber-400/10',   border: 'border-amber-400/20',   label: 'Pending'   },
    confirmed: { icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-400/10', border: 'border-emerald-400/20', label: 'Confirmed' },
    cancelled: { icon: XCircle,      color: 'text-rose-400',    bg: 'bg-rose-400/10',    border: 'border-rose-400/20',    label: 'Cancelled' },
} as const;

function DetailRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value?: string | null }) {
    if (!value) return null;
    return (
        <div className="flex items-start gap-3 py-3.5 border-b border-border/40 last:border-0">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted/60 mt-0.5">
                <Icon className="size-4 text-muted-foreground" />
            </div>
            <div className="min-w-0">
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest mb-0.5">{label}</p>
                <p className="text-[14px] font-medium text-foreground">{value}</p>
            </div>
        </div>
    );
}

export default function BookingsShow({ booking, activities }: { booking: any; activities?: any[] }) {
    const [expanded, setExpanded] = React.useState<Record<number, boolean>>({});

    const fmt = (d: string) =>
        new Date(d).toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

    const s = STATUS[booking.status as keyof typeof STATUS] ?? STATUS.pending;
    const StatusIcon = s.icon;

    const handleDelete = () => {
        if (confirm('Cancel this booking? This cannot be undone.')) {
            router.delete(toUrl(destroy({ booking: booking.id })));
        }
    };

    return (
        <PageLayout title="Booking Detail" backHref={toUrl(bookingsIndex())}>
            <Head title={`Booking — ${booking.hotel?.name}`} />

            <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_22rem] gap-6 max-w-6xl">

                <div className="max-w-2xl lg:max-w-none">
                    {/* ── Header card ─────────────────────────── */}
                    <div className="rounded-2xl border border-border/50 bg-card/50 backdrop-blur-sm p-6 mb-6">
                        <div className="flex items-start justify-between gap-4 flex-wrap">
                            <div className="flex items-center gap-4">
                                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary/10">
                                    <Building2 className="size-7 text-primary" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-foreground tracking-tight">
                                        {booking.hotel?.name}
                                    </h2>
                                    <div className="flex items-center gap-2 mt-1.5">
                                        <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[12px] font-semibold ${s.bg} ${s.border} ${s.color}`}>
                                            <StatusIcon className="size-3.5" />
                                            {s.label}
                                        </span>
                                        <span className="font-mono text-[11px] text-muted-foreground/60">
                                            #{booking.public_id?.substring(0, 8).toUpperCase()}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Action buttons */}
                            <div className="flex items-center gap-2">
                                <Link
                                    href={toUrl(edit({ booking: booking.id }))}
                                    className="inline-flex items-center gap-1.5 h-9 rounded-lg border border-border/60 bg-muted/40 px-3.5 text-[13px] font-medium text-foreground hover:bg-muted/70 transition-colors"
                                >
                                    <Pencil className="size-3.5" />
                                    Edit
                                </Link>
                                {booking.status === 'pending' && (
                                    <button
                                        type="button"
                                        onClick={handleDelete}
                                        className="inline-flex items-center gap-1.5 h-9 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3.5 text-[13px] font-medium text-rose-400 hover:bg-rose-500/20 transition-colors"
                                    >
                                        <Trash2 className="size-3.5" />
                                        Cancel
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* ── Details card ─────────────────────────── */}
                    <div className="rounded-2xl border border-border/50 bg-card/50 backdrop-blur-sm divide-y divide-border/40">

                        {/* Stay section */}
                        <div className="px-6 py-4">
                            <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Stay</p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8">
                                <DetailRow icon={CalendarDays} label="Check-in" value={booking.check_in_date ? fmt(booking.check_in_date) : null} />
                                <DetailRow icon={CalendarDays} label="Check-out" value={booking.check_out_date ? fmt(booking.check_out_date) : 'Open / TBD'} />
                                <DetailRow icon={Bed}          label="Room Type" value={booking.single_or_twin ? booking.single_or_twin.charAt(0).toUpperCase() + booking.single_or_twin.slice(1) : null} />
                            </div>
                        </div>

                        {/* Guest section */}
                        <div className="px-6 py-4">
                            <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Guest</p>
                            <DetailRow icon={User}  label="Name"  value={booking.guest_name  || booking.user?.name} />
                            <DetailRow icon={Phone} label="Phone" value={booking.guest_phone || null} />
                        </div>

                        {/* Assignment section */}
                        {(booking.rank || booking.vessel) && (
                            <div className="px-6 py-4">
                                <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Assignment</p>
                                <DetailRow icon={ShieldCheck} label="Rank"   value={booking.rank?.name   ?? null} />
                                <DetailRow icon={Anchor}      label="Vessel" value={booking.vessel?.name ?? null} />
                            </div>
                        )}

                        {/* Reference */}
                        <div className="px-6 py-4">
                            <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Reference</p>
                            <DetailRow icon={Hash} label="Booking ID" value={booking.public_id} />
                        </div>
                    </div>

                    {/* Back link */}
                    <div className="mt-6">
                        <Link
                            href={toUrl(bookingsIndex())}
                            className="inline-flex items-center gap-1.5 text-[13px] text-muted-foreground hover:text-foreground transition-colors"
                        >
                            <ArrowLeft className="size-4" />
                            Back to bookings
                        </Link>
                    </div>
                </div>

                <aside className="lg:sticky lg:top-20 h-fit">
                    <div className="rounded-2xl border border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden">
                        <div className="px-5 py-4 border-b border-border/40 flex items-center justify-between">
                            <div className="text-sm font-semibold tracking-tight">Activity</div>
                        </div>
                        <div className="max-h-[28rem] overflow-auto divide-y divide-border/40">
                            {(activities ?? []).length === 0 ? (
                                <div className="p-5 text-sm text-muted-foreground">No activity yet.</div>
                            ) : (
                                (activities ?? []).map((a: any) => (
                                    <div key={a.id} className="p-5">
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="min-w-0">
                                                <div className="text-sm font-medium text-foreground truncate">
                                                    {a.description || a.event}
                                                </div>
                                                <div className="text-[12px] text-muted-foreground mt-1 truncate">
                                                    {a.causer ? `By ${a.causer}` : 'By system'}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {a.changes?.attributes && (
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            setExpanded((prev) => ({
                                                                ...prev,
                                                                [a.id]: !prev[a.id],
                                                            }))
                                                        }
                                                        className="inline-flex items-center gap-1 rounded-full border border-border/60 bg-muted/30 px-2.5 py-1 text-[11px] text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                                                    >
                                                        {expanded[a.id] ? (
                                                            <>
                                                                Hide <ChevronUp className="size-3.5" />
                                                            </>
                                                        ) : (
                                                            <>
                                                                Expand <ChevronDown className="size-3.5" />
                                                            </>
                                                        )}
                                                    </button>
                                                )}
                                                <div className="text-[11px] text-muted-foreground whitespace-nowrap">
                                                    {new Date(a.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                                </div>
                                            </div>
                                        </div>

                                        {a.changes?.attributes && expanded[a.id] && (
                                            <div className="mt-3 rounded-xl border border-border/50 bg-muted/30 px-3 py-2">
                                                <div className="space-y-1">
                                                    {Object.entries(a.changes.attributes as Record<string, any>).map(([key, next]) => {
                                                        const prev = a.changes?.old?.[key];
                                                        const from = prev === undefined ? '—' : String(prev);
                                                        const to = next === undefined ? '—' : String(next);
                                                        return (
                                                            <div key={key} className="text-[12px] text-muted-foreground flex gap-2">
                                                                <span className="font-mono text-[11px] text-foreground/80">{key}</span>
                                                                <span className="truncate">{from}</span>
                                                                <span>→</span>
                                                                <span className="text-foreground truncate">{to}</span>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </aside>
            </div>
        </PageLayout>
    );
}

BookingsShow.layout = (page: React.ReactNode) => page;

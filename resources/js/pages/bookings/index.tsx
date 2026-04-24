import { Head, Link, router } from '@inertiajs/react';
import { Plus, CalendarDays, ArrowUpRight, Clock, CheckCircle2, XCircle, Pencil, Trash2 } from 'lucide-react';
import React from 'react';
import PageLayout from '@/layouts/page-layout';
import { toUrl } from '@/lib/utils';
import { dashboard } from '@/routes';
import { create, edit, destroy, show } from '@/routes/bookings';

const STATUS = {
    pending:   { icon: Clock,          color: 'text-amber-400',   bg: 'bg-amber-400/10',   label: 'Pending'   },
    confirmed: { icon: CheckCircle2,   color: 'text-emerald-400', bg: 'bg-emerald-400/10', label: 'Confirmed' },
    cancelled: { icon: XCircle,        color: 'text-rose-400',    bg: 'bg-rose-400/10',    label: 'Cancelled' },
} as const;

export default function BookingsIndex({ bookings }: { bookings: any[] }) {
    const fmt = (d: string) =>
        new Date(d).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });

    const total     = bookings.length;
    const pending   = bookings.filter((b) => b.status === 'pending').length;
    const confirmed = bookings.filter((b) => b.status === 'confirmed').length;

    return (
        <PageLayout title="Bookings" backHref={toUrl(dashboard())}>
            <Head title="My Bookings" />

            {/* ── Top bar ────────────────────────── */}
            <div className="flex items-start justify-between gap-6 mb-8">
                <div>
                    <h2 className="text-xl font-bold text-foreground tracking-tight">My Bookings</h2>
                    <p className="text-[13px] text-muted-foreground mt-0.5">Your hotel reservation history</p>
                </div>
                <Link
                    href={toUrl(create())}
                    className="inline-flex items-center gap-2 h-9 rounded-lg bg-primary px-4 text-[13px] font-semibold text-primary-foreground hover:bg-primary/90 transition-colors shadow-md shadow-primary/30 shrink-0"
                >
                    <Plus className="size-3.5" />
                    New
                </Link>
            </div>

            {/* ── Stats pills ─────────────────────── */}
            {total > 0 && (
                <div className="flex gap-3 mb-6 flex-wrap">
                    {[
                        { label: 'Total',     value: total,     cls: 'bg-muted/60 text-foreground'          },
                        { label: 'Pending',   value: pending,   cls: 'bg-amber-400/10 text-amber-400'       },
                        { label: 'Confirmed', value: confirmed, cls: 'bg-emerald-400/10 text-emerald-400'   },
                    ].map(({ label, value, cls }) => (
                        <div key={label} className={`inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-[12px] font-semibold ${cls}`}>
                            <span>{value}</span>
                            <span className="opacity-70">{label}</span>
                        </div>
                    ))}
                </div>
            )}

            {/* ── Empty ───────────────────────────── */}
            {total === 0 && (
                <div className="flex flex-col items-center justify-center py-28 text-center">
                    <CalendarDays className="size-10 text-muted-foreground/30 mb-4" strokeWidth={1.5} />
                    <p className="text-[15px] font-medium text-foreground">No bookings yet</p>
                    <p className="text-[13px] text-muted-foreground mt-1 mb-6">Start by submitting a new request.</p>
                    <Link
                        href={toUrl(create())}
                        className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-primary hover:underline underline-offset-4"
                    >
                        <Plus className="size-3.5" /> New Booking
                    </Link>
                </div>
            )}

            {/* ── Booking rows ────────────────────── */}
            {total > 0 && (
                <div className="rounded-xl border border-border/50 overflow-hidden">
                    {bookings.map((booking, i) => {
                        const s = STATUS[booking.status as keyof typeof STATUS] ?? STATUS.pending;
                        const StatusIcon = s.icon;
                        const isLast = i === bookings.length - 1;

                        return (
                            <Link
                                key={booking.id}
                                href={toUrl(show({ booking: booking.id }))}
                                className={`flex flex-col sm:flex-row sm:items-center gap-3 px-5 py-4 bg-card/40 hover:bg-card/80 transition-colors cursor-pointer ${!isLast ? 'border-b border-border/40' : ''}`}
                            >
                                {/* Status icon */}
                                <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${s.bg}`}>
                                    <StatusIcon className={`size-4 ${s.color}`} strokeWidth={2} />
                                </div>

                                {/* Hotel name */}
                                <div className="flex-1 min-w-0">
                                    <p className="text-[14px] font-semibold text-foreground truncate">
                                        {booking.hotel.name}
                                    </p>
                                    <p className={`text-[11px] font-medium mt-0.5 ${s.color}`}>{s.label}</p>
                                </div>

                                {/* Dates */}
                                <div className="flex items-center gap-2 text-[12px] text-muted-foreground shrink-0">
                                    <span className="font-medium text-foreground/80">{fmt(booking.check_in_date)}</span>
                                    <span>→</span>
                                    <span>{booking.check_out_date ? fmt(booking.check_out_date) : 'Open'}</span>
                                </div>

                                {/* Actions */}
                                <div className="hidden sm:flex items-center gap-1 shrink-0 ml-2">
                                    <Link
                                        href={toUrl(edit({ booking: booking.id }))}
                                        onClick={(e) => e.stopPropagation()}
                                        className="flex items-center justify-center h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
                                        title="Edit booking"
                                    >
                                        <Pencil className="size-3.5" />
                                    </Link>

                                    {booking.status === 'pending' && (
                                        <button
                                            type="button"
                                            title="Cancel booking"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                if (confirm('Cancel this booking?')) {
                                                    router.delete(toUrl(destroy({ booking: booking.id })));
                                                }
                                            }}
                                            className="flex items-center justify-center h-8 w-8 rounded-lg text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
                                        >
                                            <Trash2 className="size-3.5" />
                                        </button>
                                    )}

                                    <ArrowUpRight className="size-3.5 text-muted-foreground/30 ml-1" />
                                </div>

                            </Link>
                        );
                    })}
                </div>
            )}
        </PageLayout>
    );
}

BookingsIndex.layout = (page: React.ReactNode) => page;

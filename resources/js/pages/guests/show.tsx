import { Head, Link, router } from '@inertiajs/react';
import { Anchor, ArrowRight, Bed, Building2, CalendarDays, CheckCircle2, Clock, Hash, Mail, Pencil, Phone, Trash2, User, Users, XCircle } from 'lucide-react';
import React from 'react';
import { ActivityLog } from '@/components/details/activity-log';
import { DetailHero } from '@/components/details/detail-hero';
import { DetailItem } from '@/components/details/detail-item';
import { GlassCard } from '@/components/layout/glass-card';
import { Badge } from '@/components/ui/badge';
import { useConfirmDialog } from '@/hooks/use-confirm-dialog';
import PageLayout from '@/layouts/page-layout';
import { toUrl } from '@/lib/utils';
import { show as bookingShow } from '@/routes/bookings';
import { destroy, edit, index as guestsIndex } from '@/routes/guests';

const STATUS_CONFIG = {
    pending:   { icon: Clock,        color: 'text-warning',     bg: 'bg-warning/10',     label: 'Pending'   },
    confirmed: { icon: CheckCircle2, color: 'text-success',     bg: 'bg-success/10',     label: 'Confirmed' },
    rejected:  { icon: XCircle,      color: 'text-destructive', bg: 'bg-destructive/10', label: 'Rejected'  },
    completed: { icon: CheckCircle2, color: 'text-muted-foreground', bg: 'bg-muted/30',  label: 'Completed' },
} as const;

function fmtDate(d: string | null | undefined) {
    if (!d) {
return null;
}

    return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function GuestsShow({
    guest,
    bookings,
    activities,
    activityLookups,
}: {
    guest: any;
    bookings?: any[];
    activities?: any[];
    activityLookups?: { users?: Record<string, string> };
}) {
    const { requestConfirm, ConfirmDialog } = useConfirmDialog();
    const createdAt = guest.created_at
        ? new Date(guest.created_at).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
          })
        : null;

    return (
        <PageLayout title="Guest Detail" backHref={toUrl(guestsIndex())}>
            <ConfirmDialog />
            <Head title={`Guest — ${guest.full_name}`} />

            <div className="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-8">
                <div className="space-y-8">
                    <DetailHero
                        icon={User}
                        title={guest.full_name}
                        badges={(
                            <span className="flex items-center gap-1.5 font-mono text-[12px] font-medium text-muted-foreground/80 bg-muted/50 px-2.5 py-1 rounded-md border border-border/50">
                                <Hash className="size-3" />
                                {String(guest.id)}
                            </span>
                        )}
                        actions={(
                            <>
                                <Link
                                    href={toUrl(edit({ guest: guest.id }))}
                                    className="inline-flex items-center justify-center gap-2 h-11 rounded-xl border border-border/60 bg-background/50 hover:bg-muted px-5 text-[14px] font-medium text-foreground transition-all shadow-sm hover:shadow"
                                >
                                    <Pencil className="size-4" />
                                    Edit
                                </Link>
                                <button
                                    type="button"
                                    onClick={async () => {
                                        if (
                                            !(await requestConfirm({
                                                title: 'Delete this guest?',
                                                description: guest.bookings_count > 0
                                                    ? 'This guest is referenced by bookings and cannot be deleted.'
                                                    : 'This cannot be undone.',
                                                confirmText: 'Delete',
                                                variant: 'destructive',
                                            }))
                                        ) {
                                            return;
                                        }

                                        router.delete(toUrl(destroy({ guest: guest.id })));
                                    }}
                                    className="inline-flex items-center justify-center gap-2 h-11 rounded-xl border border-destructive/30 bg-destructive/10 hover:bg-destructive/20 px-5 text-[14px] font-medium text-destructive transition-all shadow-sm hover:shadow"
                                >
                                    <Trash2 className="size-4" />
                                    Delete
                                </button>
                            </>
                        )}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-4">
                            <h3 className="text-[13px] font-bold text-foreground uppercase tracking-widest flex items-center gap-2">
                                <User className="size-4 text-primary" /> Details
                            </h3>
                            <div className="grid gap-3">
                                <DetailItem icon={User} label="Full Name" value={guest.full_name} />
                                <DetailItem icon={Mail} label="Email" value={guest.email} />
                                <DetailItem icon={Phone} label="Phone" value={guest.phone} />
                                <DetailItem icon={Users} label="Bookings" value={guest.bookings_count ?? null} />
                                <DetailItem icon={User} label="Created By" value={guest.creator?.name ?? null} />
                                <DetailItem icon={User} label="Created" value={createdAt} />
                            </div>
                        </div>
                    </div>
                </div>

                <ActivityLog activities={activities} lookups={activityLookups} />
            </div>

            {/* ── Booking History ─── */}
            {bookings && bookings.length > 0 && (
                <div className="mt-8">
                    <h3 className="mb-4 flex items-center gap-2 text-[13px] font-bold uppercase tracking-widest text-muted-foreground">
                        <CalendarDays className="size-4 text-primary" /> Booking History
                        <span className="ml-1 rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-bold text-primary">
                            {bookings.length}
                        </span>
                    </h3>
                    <GlassCard className="overflow-hidden">
                        <div className="divide-y divide-border/30">
                            {bookings.map((b: any) => {
                                const s = STATUS_CONFIG[b.status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.pending;
                                const StatusIcon = s.icon;

                                return (
                                    <Link
                                        key={b.id}
                                        href={toUrl(bookingShow({ booking: b.id }))}
                                        className="flex items-center justify-between gap-4 px-5 py-4 transition-colors hover:bg-muted/30"
                                    >
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className={`flex size-8 shrink-0 items-center justify-center rounded-lg ${s.bg}`}>
                                                <StatusIcon className={`size-4 ${s.color}`} />
                                            </div>
                                            <div className="min-w-0">
                                                <div className="flex items-center gap-2">
                                                    {b.hotel && (
                                                        <span className="flex items-center gap-1 text-sm font-medium text-foreground truncate">
                                                            <Building2 className="size-3.5 text-muted-foreground" />
                                                            {b.hotel.name}
                                                        </span>
                                                    )}
                                                    {b.room_number && (
                                                        <Badge variant="secondary" className="shrink-0 font-mono text-[10px]">
                                                            Rm {b.room_number}
                                                        </Badge>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-3 text-[12px] text-muted-foreground">
                                                    {b.vessel && (
                                                        <span className="flex items-center gap-1">
                                                            <Anchor className="size-3" /> {b.vessel.name}
                                                        </span>
                                                    )}
                                                    {b.rank && <span>{b.rank.name}</span>}
                                                    {b.single_or_twin && (
                                                        <span className="flex items-center gap-1">
                                                            <Bed className="size-3" /> {b.single_or_twin}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="shrink-0 flex items-center gap-3 text-right">
                                            <div className="text-[12px] text-muted-foreground">
                                                <div className="font-medium text-foreground">{fmtDate(b.check_in_date) ?? '—'}</div>
                                                {b.check_out_date && <div>→ {fmtDate(b.check_out_date)}</div>}
                                            </div>
                                            <ArrowRight className="size-4 text-muted-foreground/40" />
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>
                    </GlassCard>
                </div>
            )}
        </PageLayout>
    );
}

GuestsShow.layout = (page: React.ReactNode) => page;

import { Head, Link } from '@inertiajs/react';
import {
    AlertTriangle,
    Anchor,
    ArrowRight,
    Bed,
    CalendarCheck,
    CalendarX,
    CheckCircle2,
    Clock,
    DoorOpen,
    Hash,
    LogIn,
    LogOut,
    Moon,
    Inbox,
} from 'lucide-react';
import React from 'react';
import { GlassCard } from '@/components/layout/glass-card';
import PageLayout from '@/layouts/page-layout';
import { toUrl } from '@/lib/utils';
import { index as inboxIndex } from '@/routes/hotel/bookings';
import { index as staysIndex, show as stayShow } from '@/routes/hotel/stays';

type Stats = {
    pending_inbox: number;
    total_confirmed: number;
    currently_in_house: number;
    due_checkin_today: number;
    due_checkout_today: number;
    checked_in_today: number;
    checked_out_today: number;
    overstays: number;
    in_house_no_room: number;
    completed_this_month: number;
    avg_stay_nights: number | null;
};

type BookingRow = {
    id: number;
    guest?: { full_name: string } | null;
    vessel?: { name: string } | null;
    rank?: { name: string } | null;
    room_number?: string | null;
    guest_check_in?: string | null;
    check_out_date?: string | null;
    confirmation_number?: string | null;
};

function StatCard({
    icon: Icon,
    label,
    value,
    sub,
    accent,
    href,
    alert,
}: {
    icon: React.ElementType;
    label: string;
    value: number | string;
    sub?: string;
    accent?: string;
    href?: string;
    alert?: boolean;
}) {
    const inner = (
        <GlassCard className={`flex flex-col gap-3 p-5 transition-all ${href ? 'hover:shadow-md cursor-pointer' : ''} ${alert && Number(value) > 0 ? 'border-destructive/40 bg-destructive/5' : ''}`}>
            <div className="flex items-center justify-between">
                <div className={`flex size-9 items-center justify-center rounded-lg ${accent ?? 'bg-primary/10'}`}>
                    <Icon className={`size-4 ${alert && Number(value) > 0 ? 'text-destructive' : 'text-primary'}`} />
                </div>
                {href && <ArrowRight className="size-4 text-muted-foreground/40" />}
            </div>
            <div>
                <div className={`text-2xl font-bold tracking-tight ${alert && Number(value) > 0 ? 'text-destructive' : 'text-foreground'}`}>
                    {value}
                </div>
                <div className="text-sm text-muted-foreground">{label}</div>
                {sub && <div className="mt-1 text-[11px] text-muted-foreground/60">{sub}</div>}
            </div>
        </GlassCard>
    );

    if (href) {
        return <Link href={href}>{inner}</Link>;
    }

    return inner;
}

function fmtDate(d: string | null | undefined) {
    if (!d) {
return '—';
}

    return new Date(d).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    });
}

function fmtDateTime(d: string | null | undefined) {
    if (!d) {
return '—';
}

    return new Date(d).toLocaleString('en-GB', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
    });
}

export default function HotelOverview({
    stats,
    recent_in_house,
    upcoming_checkins,
    today,
}: {
    stats: Stats;
    recent_in_house: BookingRow[];
    upcoming_checkins: BookingRow[];
    today: string;
}) {
    return (
        <PageLayout title="Overview">
            <Head title="Hotel Overview" />

            <div className="space-y-8">
                {/* ── Today's snapshot ─── */}
                <section className="space-y-4">
                    <h2 className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                        Today — {new Date(today + 'T00:00:00').toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}
                    </h2>

                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                        <StatCard
                            icon={Inbox}
                            label="Pending Inbox"
                            value={stats.pending_inbox}
                            accent="bg-amber-500/10"
                            href={toUrl(inboxIndex())}
                            alert={stats.pending_inbox > 0}
                        />
                        <StatCard
                            icon={Bed}
                            label="Currently In-House"
                            value={stats.currently_in_house}
                            accent="bg-green-500/10"
                            href={toUrl(staysIndex({ query: { tab: 'in_house' } }))}
                        />
                        <StatCard
                            icon={LogIn}
                            label="Due Check-in"
                            value={stats.due_checkin_today}
                            sub="Scheduled today"
                            accent="bg-blue-500/10"
                            href={toUrl(staysIndex({ query: { tab: 'to_checkin' } }))}
                        />
                        <StatCard
                            icon={LogOut}
                            label="Due Check-out"
                            value={stats.due_checkout_today}
                            sub="Expected today"
                            accent="bg-purple-500/10"
                            href={toUrl(staysIndex({ query: { tab: 'in_house' } }))}
                        />
                        <StatCard
                            icon={CheckCircle2}
                            label="Checked In Today"
                            value={stats.checked_in_today}
                            accent="bg-emerald-500/10"
                        />
                        <StatCard
                            icon={DoorOpen}
                            label="Checked Out Today"
                            value={stats.checked_out_today}
                            accent="bg-slate-500/10"
                        />
                        <StatCard
                            icon={AlertTriangle}
                            label="Overstays"
                            value={stats.overstays}
                            sub="Past check-out date"
                            accent="bg-destructive/10"
                            alert
                        />
                        <StatCard
                            icon={Hash}
                            label="No Room #"
                            value={stats.in_house_no_room}
                            sub="In-house, unassigned"
                            accent="bg-orange-500/10"
                            alert={stats.in_house_no_room > 0}
                        />
                    </div>
                </section>

                {/* ── Month summary ─── */}
                <section className="space-y-4">
                    <h2 className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                        {new Date().toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}
                    </h2>

                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                        <StatCard
                            icon={CalendarX}
                            label="Completed Stays"
                            value={stats.completed_this_month}
                            accent="bg-teal-500/10"
                        />
                        <StatCard
                            icon={Moon}
                            label="Avg. Stay"
                            value={stats.avg_stay_nights !== null ? `${stats.avg_stay_nights} nights` : '—'}
                            accent="bg-indigo-500/10"
                        />
                        <StatCard
                            icon={CalendarCheck}
                            label="Total Confirmed"
                            value={stats.total_confirmed}
                            accent="bg-primary/10"
                        />
                    </div>
                </section>

                {/* ── Tables side-by-side ─── */}
                <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
                    {/* Currently In-House */}
                    <GlassCard className="overflow-hidden">
                        <div className="flex items-center justify-between border-b border-border/40 px-5 py-4">
                            <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
                                <Bed className="size-4 text-green-500" />
                                Currently In-House
                                <span className="ml-1 rounded-full bg-green-500/10 px-2 py-0.5 text-[11px] font-bold text-green-600 dark:text-green-400">
                                    {recent_in_house.length}
                                </span>
                            </h3>
                            <Link
                                href={toUrl(staysIndex({ query: { tab: 'in_house' } }))}
                                className="flex items-center gap-1 text-[12px] font-medium text-primary hover:underline"
                            >
                                View all <ArrowRight className="size-3" />
                            </Link>
                        </div>

                        {recent_in_house.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-10 text-center text-muted-foreground">
                                <Bed className="mb-2 size-8 opacity-30" />
                                <p className="text-sm">No guests currently in house</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-border/30">
                                {recent_in_house.map((b) => (
                                    <Link
                                        key={b.id}
                                        href={toUrl(stayShow({ booking: b.id }))}
                                        className="flex items-center justify-between px-5 py-3 text-sm transition-colors hover:bg-muted/30"
                                    >
                                        <div className="min-w-0">
                                            <div className="truncate font-medium text-foreground">
                                                {b.guest?.full_name ?? '—'}
                                            </div>
                                            <div className="flex items-center gap-2 text-[12px] text-muted-foreground">
                                                {b.vessel && (
                                                    <span className="flex items-center gap-1">
                                                        <Anchor className="size-3" />
                                                        {b.vessel.name}
                                                    </span>
                                                )}
                                                {b.rank && <span>{b.rank.name}</span>}
                                            </div>
                                        </div>
                                        <div className="shrink-0 text-right text-[12px] text-muted-foreground">
                                            {b.room_number ? (
                                                <span className="font-mono font-semibold text-foreground">
                                                    Rm {b.room_number}
                                                </span>
                                            ) : (
                                                <span className="text-destructive/70">No room</span>
                                            )}
                                            <div>{fmtDateTime(b.guest_check_in)}</div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </GlassCard>

                    {/* Upcoming Check-ins */}
                    <GlassCard className="overflow-hidden">
                        <div className="flex items-center justify-between border-b border-border/40 px-5 py-4">
                            <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
                                <Clock className="size-4 text-blue-500" />
                                Upcoming Check-ins
                                <span className="ml-1 rounded-full bg-blue-500/10 px-2 py-0.5 text-[11px] font-bold text-blue-600 dark:text-blue-400">
                                    {upcoming_checkins.length}
                                </span>
                            </h3>
                            <Link
                                href={toUrl(staysIndex({ query: { tab: 'to_checkin' } }))}
                                className="flex items-center gap-1 text-[12px] font-medium text-primary hover:underline"
                            >
                                View all <ArrowRight className="size-3" />
                            </Link>
                        </div>

                        {upcoming_checkins.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-10 text-center text-muted-foreground">
                                <CalendarCheck className="mb-2 size-8 opacity-30" />
                                <p className="text-sm">No upcoming check-ins</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-border/30">
                                {upcoming_checkins.map((b) => (
                                    <Link
                                        key={b.id}
                                        href={toUrl(stayShow({ booking: b.id }))}
                                        className="flex items-center justify-between px-5 py-3 text-sm transition-colors hover:bg-muted/30"
                                    >
                                        <div className="min-w-0">
                                            <div className="truncate font-medium text-foreground">
                                                {b.guest?.full_name ?? '—'}
                                            </div>
                                            <div className="flex items-center gap-2 text-[12px] text-muted-foreground">
                                                {b.vessel && (
                                                    <span className="flex items-center gap-1">
                                                        <Anchor className="size-3" />
                                                        {b.vessel.name}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="shrink-0 text-right text-[12px] text-muted-foreground">
                                            <div className="font-semibold text-foreground">
                                                {fmtDate(b.check_in_date)}
                                            </div>
                                            {b.check_out_date && (
                                                <div>→ {fmtDate(b.check_out_date)}</div>
                                            )}
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </GlassCard>
                </div>
            </div>
        </PageLayout>
    );
}

HotelOverview.layout = (page: React.ReactNode) => page;

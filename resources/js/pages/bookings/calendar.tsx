import { Head, Link, router } from '@inertiajs/react';
import { CalendarDays, ChevronLeft, ExternalLink, Users } from 'lucide-react';
import React, { useMemo, useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import PageLayout from '@/layouts/page-layout';
import { toUrl } from '@/lib/utils';
import { index as bookingsIndex, show as showBooking } from '@/routes/bookings';

type Booking = {
    id: number;
    public_id: string;
    hotel: { id: number | null; name: string | null };
    guest_name: string | null;
    rank: string | null;
    vessel: string | null;
    guest_check_in: string;
    guest_check_out: string | null;
};

type Props = {
    month: string; // YYYY-MM
    bookings: Booking[];
};

function startOfMonth(month: string): Date {
    const [y, m] = month.split('-').map((x) => Number(x));

    return new Date(y, m - 1, 1);
}

function addDays(d: Date, days: number): Date {
    const next = new Date(d);
    next.setDate(next.getDate() + days);

    return next;
}

function toDateKey(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');

    return `${y}-${m}-${day}`;
}

function dateOnly(value: string): string {
    return value.slice(0, 10);
}

function formatTime(iso: string): string {
    const d = new Date(iso);

    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

export default function BookingsCalendar({ month, bookings }: Props) {
    const monthStart = useMemo(() => startOfMonth(month), [month]);
    const todayKey = useMemo(() => toDateKey(new Date()), []);
    const monthLabel = useMemo(() => {
        return monthStart.toLocaleDateString('en-US', {
            month: 'long',
            year: 'numeric',
        });
    }, [monthStart]);

    const grid = useMemo(() => {
        const first = startOfMonth(month);
        const startDow = first.getDay(); // 0..6, Sunday start
        const gridStart = addDays(first, -startDow);

        return Array.from({ length: 42 }, (_, i) => addDays(gridStart, i));
    }, [month]);

    const byDay = useMemo(() => {
        const map = new Map<string, Booking[]>();
        const monthStartKey = toDateKey(monthStart);
        const monthEnd = new Date(
            monthStart.getFullYear(),
            monthStart.getMonth() + 1,
            0,
        );
        const monthEndKey = toDateKey(monthEnd);
        const monthEndExclusive = addDays(monthEnd, 1);

        for (const b of bookings) {
            const inKey = dateOnly(b.guest_check_in);
            const outKey = b.guest_check_out ? dateOnly(b.guest_check_out) : null;

            const startKey = inKey > monthStartKey ? inKey : monthStartKey;
            const start = new Date(`${startKey}T00:00:00`);
            const endExclusive = outKey
                ? new Date(`${outKey}T00:00:00`)
                : monthEndExclusive;

            if (endExclusive <= start) {
                continue;
            }

            for (
                let d = new Date(start);
                d < endExclusive && toDateKey(d) <= monthEndKey;
                d = addDays(d, 1)
            ) {
                const key = toDateKey(d);
                const list = map.get(key) ?? [];
                list.push(b);
                map.set(key, list);
            }
        }

        return map;
    }, [bookings, monthStart]);

    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const [selectedDayKey, setSelectedDayKey] = useState<string | null>(null);

    const selectedBookings = useMemo(() => {
        if (!selectedDayKey) {
            return [];
        }

        return byDay.get(selectedDayKey) ?? [];
    }, [byDay, selectedDayKey]);

    const selectedLabel = useMemo(() => {
        if (!selectedDayKey) {
            return '';
        }

        return new Date(`${selectedDayKey}T00:00:00`).toLocaleDateString(
            'en-US',
            { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' },
        );
    }, [selectedDayKey]);

    return (
        <PageLayout title="In-House Calendar" backHref="__history__">
            <Head title="In-House Calendar" />

            <div className="max-w-[1100px] mx-auto space-y-6">
                <div className="sticky top-16 z-20 -mx-6 bg-background/30 px-6 py-3 backdrop-blur-xl md:-mx-10 md:px-10">
                    <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-border/50 bg-card/40 backdrop-blur-xl">
                                <CalendarDays className="size-6 text-primary" />
                            </div>
                            <div>
                                <div className="text-sm font-semibold text-muted-foreground">
                                    Current month
                                </div>
                                <div className="text-2xl font-bold tracking-tight text-foreground">
                                    {monthLabel}
                                </div>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={() => {
                                if (typeof window !== 'undefined' && window.history.length > 1) {
                                    window.history.back();

                                    return;
                                }

                                router.visit(toUrl(bookingsIndex()));
                            }}
                            className="inline-flex items-center gap-2 rounded-xl border border-border/60 bg-background/50 px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
                        >
                            <ChevronLeft className="size-4" />
                            Back
                        </button>
                    </div>

                </div>

                <div className="rounded-4xl border border-border/50 bg-card/40 backdrop-blur-xl p-6 shadow-lg">
                    <div className="grid grid-cols-7 gap-3">
                        {dayNames.map((d) => (
                            <div
                                key={d}
                                className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground"
                            >
                                {d}
                            </div>
                        ))}

                        {grid.map((d) => {
                            const inMonth = d.getMonth() === monthStart.getMonth();
                            const key = toDateKey(d);
                            const list = byDay.get(key) ?? [];
                            const count = list.length;
                            const isToday = key === todayKey;
                            const showCount = count > 0;

                            return (
                                <button
                                    type="button"
                                    key={key}
                                    onClick={() => setSelectedDayKey(key)}
                                    className={[
                                        'relative h-20 rounded-2xl border border-border/40 bg-background/30 p-3 text-left transition-colors hover:bg-muted/30',
                                        isToday
                                            ? 'ring-2 ring-emerald-500/50'
                                            : '',
                                        inMonth
                                            ? 'text-foreground'
                                            : 'text-muted-foreground/60 opacity-60',
                                    ].join(' ')}
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="text-sm font-bold">
                                            {d.getDate()}
                                        </div>

                                        {count > 0 && (
                                            <div className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-emerald-500/15 px-2 text-[12px] font-black text-emerald-500">
                                                {count}
                                            </div>
                                        )}
                                    </div>

                                    {showCount ? null : (
                                        <div className="mt-3 text-[12px] font-bold text-muted-foreground/50">
                                            —
                                        </div>
                                    )}
                                </button>
                            );
                        })}
                    </div>

                    {bookings.length === 0 && (
                        <div className="mt-6 text-sm text-muted-foreground">
                            No in-house guests this month.
                        </div>
                    )}
                </div>
            </div>

            <Dialog
                open={selectedDayKey !== null}
                onOpenChange={(open) => {
                    if (!open) {
                        setSelectedDayKey(null);
                    }
                }}
            >
                <DialogContent className="rounded-4xl border border-border/60 bg-card/60 backdrop-blur-xl">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Users className="size-5 text-primary" />
                            {selectedLabel}
                        </DialogTitle>
                        <DialogDescription>
                            In-house guests for this date.
                        </DialogDescription>
                    </DialogHeader>

                    {selectedBookings.length === 0 ? (
                        <div className="rounded-3xl border border-border/40 bg-background/30 p-4 text-sm font-semibold text-muted-foreground">
                            No in-house guests.
                        </div>
                    ) : (
                        <div className="grid gap-2">
                            {selectedBookings.map((b) => (
                                <Link
                                    key={b.id}
                                    href={toUrl(showBooking({ booking: b.id }))}
                                    className="flex items-center justify-between gap-3 rounded-3xl border border-border/40 bg-background/30 px-4 py-3 text-sm transition-colors hover:bg-muted/30"
                                >
                                    <div className="min-w-0">
                                        <div className="truncate font-semibold text-foreground">
                                            {b.guest_name ?? 'Guest'} •{' '}
                                            {b.hotel?.name ?? 'Hotel'}
                                        </div>
                                        <div className="truncate text-[12px] font-semibold text-muted-foreground">
                                            {b.rank ?? '—'} • {b.vessel ?? '—'}
                                        </div>
                                    </div>
                                    <div className="shrink-0 text-right">
                                        <div className="text-[12px] font-bold text-muted-foreground">
                                            {formatTime(b.guest_check_in)}
                                        </div>
                                        <div className="mt-1 inline-flex items-center gap-1 text-[12px] font-bold text-primary">
                                            Open <ExternalLink className="size-3.5" />
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </PageLayout>
    );
}

BookingsCalendar.layout = (page: React.ReactNode) => page;


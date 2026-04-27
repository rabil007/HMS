import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { ArrowLeft, CalendarCheck, CheckCircle2, Clock, Hash, ShieldCheck, User, XCircle } from 'lucide-react';
import React from 'react';
import { DetailHero } from '@/components/details/detail-hero';
import { DetailItem } from '@/components/details/detail-item';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import PageLayout from '@/layouts/page-layout';
import { toUrl } from '@/lib/utils';
import { checkIn, checkOut, index as staysIndex } from '@/routes/hotel/stays';

function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
}

function pad2(n: number) {
    return String(n).padStart(2, '0');
}

function toLocalDateTimeInput(d: Date) {
    const y = d.getFullYear();
    const m = pad2(d.getMonth() + 1);
    const day = pad2(d.getDate());
    const hh = pad2(d.getHours());
    const mm = pad2(d.getMinutes());

    return `${y}-${m}-${day}T${hh}:${mm}`;
}

export default function HotelStayShow({ booking }: { booking: any }) {
    const isCheckedIn = Boolean(booking.guest_check_in);
    const isCheckedOut = Boolean(booking.guest_check_out);

    const page = usePage();
    const pageUrl = String((page as any)?.url ?? '');
    const scannedConfirmation = React.useMemo(() => {
        const idx = pageUrl.indexOf('?');

        if (idx === -1) {
            return '';
        }

        const params = new URLSearchParams(pageUrl.slice(idx + 1));

        return (params.get('confirmation') ?? '').trim();
    }, [pageUrl]);

    const checkInForm = useForm<{ confirmation_number: string; guest_check_in: string }>({
        confirmation_number: scannedConfirmation,
        guest_check_in: (() => {
            const existing = String(booking.actual_check_in_date ?? booking.check_in_date ?? '').slice(0, 10);

            if (existing) {
                const d = new Date(`${existing}T00:00:00`);

                return toLocalDateTimeInput(d);
            }

            return toLocalDateTimeInput(new Date());
        })(),
    });

    const checkOutForm = useForm<{ guest_check_out: string }>({
        guest_check_out: (() => {
            const existing = String(booking.actual_check_out_date ?? booking.check_out_date ?? '').slice(0, 10);

            if (existing) {
                const d = new Date(`${existing}T00:00:00`);

                return toLocalDateTimeInput(d);
            }

            return toLocalDateTimeInput(new Date());
        })(),
    });

    const StatusIcon = isCheckedOut ? CheckCircle2 : isCheckedIn ? ShieldCheck : Clock;

    const headerBadges = (
        <>
            <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[12px] font-semibold shadow-sm ${
                isCheckedOut
                    ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                    : isCheckedIn
                        ? 'bg-sky-500/10 text-sky-400 border-sky-500/20'
                        : 'bg-amber-500/10 text-amber-500 border-amber-500/20'
            }`}>
                <StatusIcon className="size-4" />
                {isCheckedOut ? 'Checked out' : isCheckedIn ? 'In-house' : 'To check-in'}
            </span>
            <span className="flex items-center gap-1.5 font-mono text-[12px] font-medium text-muted-foreground/80 bg-muted/50 px-2.5 py-1 rounded-md border border-border/50">
                <Hash className="size-3" />
                {String(booking.public_id ?? booking.id)}
            </span>
        </>
    );

    const actions = (
        <Link
            href={toUrl(staysIndex())}
            className="inline-flex items-center justify-center gap-2 h-11 rounded-xl border border-border/60 bg-background/50 hover:bg-muted px-5 text-[14px] font-medium text-foreground transition-all shadow-sm hover:shadow"
        >
            <ArrowLeft className="size-4" />
            Back
        </Link>
    );

    return (
        <PageLayout title="Stay" backHref={toUrl(staysIndex())}>
            <Head title="Stay" />

            <div className="max-w-[1200px] mx-auto space-y-8">
                <DetailHero icon={CalendarCheck} title={booking.hotel?.name ?? 'Hotel'} badges={headerBadges} actions={actions} />

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 rounded-4xl border border-border/50 bg-card/40 backdrop-blur-xl p-6 shadow-lg space-y-6">
                        <div className="flex items-center justify-between">
                            <h3 className="text-base font-bold text-foreground">Stay</h3>
                            {booking.confirmation_number && (
                                <Badge variant="outline" className="rounded-full">
                                    <Hash className="size-3 mr-1" /> {booking.confirmation_number}
                                </Badge>
                            )}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <DetailItem icon={User} label="Guest" value={booking.guest_name ?? booking.user?.name ?? 'Guest'} />
                            <DetailItem icon={ShieldCheck} label="Agency" value={booking.client?.name ?? '—'} />
                            <DetailItem icon={CalendarCheck} label="Scheduled check-in" value={booking.check_in_date ? formatDate(booking.check_in_date) : '—'} />
                            <DetailItem icon={CalendarCheck} label="Scheduled check-out" value={booking.check_out_date ? formatDate(booking.check_out_date) : 'OPEN'} />
                            <DetailItem icon={CalendarCheck} label="Actual check-in" value={booking.actual_check_in_date ? formatDate(booking.actual_check_in_date) : '—'} />
                            <DetailItem icon={CalendarCheck} label="Actual check-out" value={booking.actual_check_out_date ? formatDate(booking.actual_check_out_date) : (booking.actual_check_in_date ? 'OPEN' : '—')} />
                            <DetailItem icon={CalendarCheck} label="Guest check-in" value={booking.guest_check_in ? formatDate(booking.guest_check_in) : '—'} />
                            <DetailItem icon={CalendarCheck} label="Guest check-out" value={booking.guest_check_out ? formatDate(booking.guest_check_out) : (booking.guest_check_in ? 'OPEN' : '—')} />
                        </div>
                    </div>

                    <div className="rounded-4xl border border-border/50 bg-card/40 backdrop-blur-xl p-6 shadow-lg space-y-4">
                        {!isCheckedIn && (
                            <>
                                <div className="flex items-center gap-2">
                                    <Clock className="size-4 text-amber-500" />
                                    <h3 className="text-base font-bold text-foreground">Check-in</h3>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-foreground">Confirmation Number</label>
                                    <Input
                                        value={checkInForm.data.confirmation_number}
                                        onChange={(e) => checkInForm.setData('confirmation_number', e.target.value)}
                                        placeholder="Enter confirmation number"
                                        className="h-11 rounded-xl"
                                    />
                                    {checkInForm.errors.confirmation_number && (
                                        <p className="text-xs text-rose-500">{checkInForm.errors.confirmation_number}</p>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-foreground">Check-in Date & Time</label>
                                    <Input
                                        type="datetime-local"
                                        value={checkInForm.data.guest_check_in}
                                        onChange={(e) => checkInForm.setData('guest_check_in', e.target.value)}
                                        className="h-11 rounded-xl"
                                    />
                                    {checkInForm.errors.guest_check_in && (
                                        <p className="text-xs text-rose-500">{checkInForm.errors.guest_check_in}</p>
                                    )}
                                </div>
                                <Button
                                    onClick={() => checkInForm.put(toUrl(checkIn({ booking: booking.id })))}
                                    disabled={checkInForm.processing}
                                    className="w-full rounded-xl h-11 bg-amber-500 hover:bg-amber-600 text-white"
                                >
                                    {checkInForm.processing ? 'Processing…' : 'Verify & Check-in'}
                                </Button>
                            </>
                        )}

                        {isCheckedIn && !isCheckedOut && (
                            <>
                                <div className="flex items-center gap-2">
                                    <ShieldCheck className="size-4 text-sky-400" />
                                    <h3 className="text-base font-bold text-foreground">Check-out</h3>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-foreground">Check-out Date & Time</label>
                                    <Input
                                        type="datetime-local"
                                        value={checkOutForm.data.guest_check_out}
                                        onChange={(e) => checkOutForm.setData('guest_check_out', e.target.value)}
                                        className="h-11 rounded-xl"
                                    />
                                    {checkOutForm.errors.guest_check_out && (
                                        <p className="text-xs text-rose-500">{checkOutForm.errors.guest_check_out}</p>
                                    )}
                                </div>
                                <Button
                                    onClick={() => checkOutForm.put(toUrl(checkOut({ booking: booking.id })))}
                                    disabled={checkOutForm.processing}
                                    className="w-full rounded-xl h-11 bg-sky-500 hover:bg-sky-600 text-white"
                                >
                                    {checkOutForm.processing ? 'Processing…' : 'Check-out'}
                                </Button>
                            </>
                        )}

                        {isCheckedOut && (
                            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4">
                                <div className="flex items-center gap-2 text-emerald-500">
                                    <CheckCircle2 className="size-4" />
                                    <p className="text-sm font-semibold">Checked out</p>
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">No further action required.</p>
                            </div>
                        )}

                        {String(booking.status).toLowerCase() !== 'confirmed' && (
                            <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 p-4">
                                <div className="flex items-center gap-2 text-rose-500">
                                    <XCircle className="size-4" />
                                    <p className="text-sm font-semibold">Not eligible</p>
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">Only confirmed bookings can be checked in/out.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </PageLayout>
    );
}

HotelStayShow.layout = (page: React.ReactNode) => page;


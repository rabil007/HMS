import { Head, useForm } from '@inertiajs/react';
import React, { useMemo, useState } from 'react';
import PageLayout from '@/layouts/page-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toUrl } from '@/lib/utils';
import { dashboard } from '@/routes';
import { approve, index as hotelBookingsIndex, reject } from '@/routes/hotel/bookings';

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

    const pending = useMemo(() => bookings.filter((b) => b.status === 'pending'), [bookings]);
    const others = useMemo(() => bookings.filter((b) => b.status !== 'pending'), [bookings]);

    const approveForm = useForm<{ confirmation_number: string; remarks: string }>({
        confirmation_number: '',
        remarks: '',
    });

    const rejectForm = useForm<{ remarks: string }>({
        remarks: '',
    });

    const openApprove = (b: BookingRow) => {
        setSelected(b);
        approveForm.setData({
            confirmation_number: b.confirmation_number ?? '',
            remarks: b.remarks ?? '',
        });
        rejectForm.reset();
    };

    const openReject = (b: BookingRow) => {
        setSelected(b);
        rejectForm.setData({ remarks: b.remarks ?? '' });
        approveForm.reset();
    };

    const close = () => {
        setSelected(null);
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

            <div className="flex items-center justify-between gap-4 mb-8">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Booking Inbox</h2>
                    <p className="text-muted-foreground mt-2">
                        Review and approve or reject booking requests.
                    </p>
                </div>

                <Button asChild variant="outline" className="rounded-full">
                    <a href={toUrl(hotelBookingsIndex())}>Refresh</a>
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <section className="rounded-2xl border border-border/80 bg-card/60 backdrop-blur-xl overflow-hidden">
                    <div className="p-6 border-b border-border/60 flex items-center justify-between">
                        <div className="font-semibold">Pending</div>
                        <Badge variant="secondary">{pending.length}</Badge>
                    </div>
                    <div className="divide-y divide-border/60">
                        {pending.length === 0 ? (
                            <div className="p-6 text-muted-foreground">No pending requests.</div>
                        ) : (
                            pending.map((b) => (
                                <button
                                    type="button"
                                    key={b.id}
                                    onClick={() => openApprove(b)}
                                    className="w-full text-left p-6 hover:bg-muted/40 transition-colors"
                                >
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="min-w-0">
                                            <div className="font-medium truncate">
                                                {b.guest_name ?? b.user?.name ?? 'Guest'}
                                            </div>
                                            <div className="text-sm text-muted-foreground truncate">
                                                {b.client?.name ? `Client: ${b.client.name}` : 'Client: —'}
                                            </div>
                                        </div>
                                        <Badge className="uppercase">pending</Badge>
                                    </div>
                                    <div className="mt-4 text-sm text-muted-foreground">
                                        {formatDate(b.check_in_date)} → {b.check_out_date ? formatDate(b.check_out_date) : 'OPEN'}
                                    </div>
                                </button>
                            ))
                        )}
                    </div>
                </section>

                <section className="rounded-2xl border border-border/80 bg-card/60 backdrop-blur-xl overflow-hidden">
                    <div className="p-6 border-b border-border/60 flex items-center justify-between">
                        <div className="font-semibold">History</div>
                        <Badge variant="secondary">{others.length}</Badge>
                    </div>
                    <div className="divide-y divide-border/60">
                        {others.length === 0 ? (
                            <div className="p-6 text-muted-foreground">No previous decisions.</div>
                        ) : (
                            others.slice(0, 25).map((b) => (
                                <div key={b.id} className="p-6">
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="min-w-0">
                                            <div className="font-medium truncate">
                                                {b.guest_name ?? b.user?.name ?? 'Guest'}
                                            </div>
                                            <div className="text-sm text-muted-foreground truncate">
                                                {b.client?.name ? `Client: ${b.client.name}` : 'Client: —'}
                                            </div>
                                        </div>
                                        <Badge variant={b.status === 'confirmed' ? 'default' : 'destructive'} className="uppercase">
                                            {b.status}
                                        </Badge>
                                    </div>
                                    <div className="mt-4 text-sm text-muted-foreground">
                                        {formatDate(b.check_in_date)} → {b.check_out_date ? formatDate(b.check_out_date) : 'OPEN'}
                                    </div>
                                    {b.confirmation_number ? (
                                        <div className="mt-2 text-sm">
                                            <span className="text-muted-foreground">Confirmation:</span> {b.confirmation_number}
                                        </div>
                                    ) : null}
                                    {b.remarks ? (
                                        <div className="mt-1 text-sm">
                                            <span className="text-muted-foreground">Remarks:</span> {b.remarks}
                                        </div>
                                    ) : null}
                                </div>
                            ))
                        )}
                    </div>
                </section>
            </div>

            {selected ? (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
                    <div className="absolute inset-0 bg-black/50" onClick={close} />
                    <div className="relative w-full max-w-xl rounded-2xl border border-border bg-background p-6 shadow-2xl">
                        <div className="flex items-start justify-between gap-4">
                            <div className="min-w-0">
                                <div className="text-lg font-semibold truncate">
                                    {selected.guest_name ?? selected.user?.name ?? 'Guest'}
                                </div>
                                <div className="text-sm text-muted-foreground truncate">
                                    {selected.client?.name ? `Client: ${selected.client.name}` : 'Client: —'}
                                </div>
                                <div className="mt-2 text-sm text-muted-foreground">
                                    {formatDate(selected.check_in_date)} → {selected.check_out_date ? formatDate(selected.check_out_date) : 'OPEN'}
                                </div>
                            </div>
                            <Button variant="outline" className="rounded-full" onClick={close}>
                                Close
                            </Button>
                        </div>

                        <div className="mt-6 grid grid-cols-1 gap-6">
                            <div className="rounded-xl border border-border/70 p-4">
                                <div className="font-medium mb-3">Approve</div>
                                <div className="grid grid-cols-1 gap-3">
                                    <div>
                                        <div className="text-sm text-muted-foreground mb-1">Confirmation number</div>
                                        <Input
                                            value={approveForm.data.confirmation_number}
                                            onChange={(e) => approveForm.setData('confirmation_number', e.target.value)}
                                            placeholder="e.g. CNF-12345"
                                        />
                                    </div>
                                    <div>
                                        <div className="text-sm text-muted-foreground mb-1">Remarks (optional)</div>
                                        <textarea
                                            value={approveForm.data.remarks}
                                            onChange={(e) => approveForm.setData('remarks', e.target.value)}
                                            placeholder="Optional notes for the client"
                                            className="min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                                        />
                                    </div>
                                    <Button
                                        className="rounded-full"
                                        disabled={approveForm.processing}
                                        onClick={submitApprove}
                                    >
                                        Approve booking
                                    </Button>
                                </div>
                            </div>

                            <div className="rounded-xl border border-border/70 p-4">
                                <div className="font-medium mb-3">Reject</div>
                                <div className="grid grid-cols-1 gap-3">
                                    <div>
                                        <div className="text-sm text-muted-foreground mb-1">Remarks (required)</div>
                                        <textarea
                                            value={rejectForm.data.remarks}
                                            onChange={(e) => rejectForm.setData('remarks', e.target.value)}
                                            placeholder="Reason for rejection"
                                            className="min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                                        />
                                    </div>
                                    <Button
                                        variant="destructive"
                                        className="rounded-full"
                                        disabled={rejectForm.processing}
                                        onClick={submitReject}
                                    >
                                        Reject booking
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            ) : null}
        </PageLayout>
    );
}

HotelBookingsIndex.layout = (page: React.ReactNode) => page;


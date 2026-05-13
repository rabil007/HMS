import { Head, useForm } from '@inertiajs/react';
import {
    ArrowRight,
    Calendar,
    Clock,
    DoorOpen,
    Info,
    Ship,
    User,
} from 'lucide-react';
import React, { useState } from 'react';
import { GuestQuickCreateModal } from '@/components/bookings/guest-quick-create-modal';
import InputError from '@/components/input-error';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SearchSelect } from '@/components/ui/search-select';
import { Spinner } from '@/components/ui/spinner';
import PageLayout from '@/layouts/page-layout';
import { toUrl } from '@/lib/utils';
import {
    store as storeBackfill,
    update as updateBackfill,
} from '@/routes/admin/bookings/backfill';
import { store as storeHotel } from '@/routes/admin/hotels';
import { store as storeRank } from '@/routes/admin/ranks';
import { store as storeVessel } from '@/routes/admin/vessels';

/* ─── Page ──────────────────────────────────────────────────────────────── */

type PageProps = {
    guests: Array<{ id: number; name: string }>;
    hotels: Array<{ id: number; name: string }>;
    clients: Array<{ id: number; name: string }>;
    vessels: Array<{ id: number; name: string }>;
    ranks: Array<{ id: number; name: string }>;
    countries: Array<{ id: number; name: string; code: string }>;
    booking?: {
        id: number;
        guest_id: number | null;
        hotel_id: number | null;
        client_id: number | null;
        vessel_id: number | null;
        rank_id: number | null;
        guest_check_in: string | null;
        guest_check_out: string | null;
        room_number: string | null;
        single_or_twin: string | null;
        confirmation_number: string | null;
    } | null;
};

export default function BackfillBooking({
    guests: initialGuests,
    hotels: initialHotels,
    clients: initialClients,
    vessels: initialVessels,
    ranks: initialRanks,
    countries,
    booking,
}: PageProps) {
        const [guests, setGuests] = useState(initialGuests);
    const [hotels, setHotels] = useState(initialHotels);
    const [vessels, setVessels] = useState(initialVessels);
    const [ranks, setRanks] = useState(initialRanks);

    const [showGuestModal, setShowGuestModal] = useState(false);
    const [guestModalName, setGuestModalName] = useState('');

    const isEditMode = Boolean(booking);
    const { data, setData, post, put, processing, errors } = useForm({
        guest_id: booking?.guest_id ? String(booking.guest_id) : '',
        hotel_id: booking?.hotel_id ? String(booking.hotel_id) : '',
        client_id: booking?.client_id ? String(booking.client_id) : '',
        vessel_id: booking?.vessel_id ? String(booking.vessel_id) : '',
        rank_id: booking?.rank_id ? String(booking.rank_id) : '',
        guest_check_in: booking?.guest_check_in ?? '',
        guest_check_out: booking?.guest_check_out ?? '',
        room_number: booking?.room_number ?? '',
        single_or_twin: booking?.single_or_twin ?? 'single',
        confirmation_number: booking?.confirmation_number ?? '',
    });

    const handleGuestCreate = (name: string) => {
        setGuestModalName(name);
        setShowGuestModal(true);
    };

    const handleGuestCreated = (newGuest: {
        id: number;
        full_name: string;
    }) => {
        setGuests((prev) => [
            ...prev,
            { id: newGuest.id, name: newGuest.full_name },
        ]);
        setData('guest_id', newGuest.id.toString());
        setShowGuestModal(false);
    };

    const createLookupInline = async (
        endpoint: string,
        name: string,
    ) => {
        const csrfToken =
            document
                .querySelector('meta[name="csrf-token"]')
                ?.getAttribute('content') ?? '';

        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': csrfToken,
                'X-Requested-With': 'XMLHttpRequest',
            },
            body: JSON.stringify({ name }),
        });

        const payload = await response.json().catch(() => null);

        if (!response.ok) {
            console.error('Failed to create:', payload);

            return null;
        }

        return payload;
    };

    const handleCreateHotel = async (name: string) => {
        const payload = await createLookupInline(toUrl(storeHotel()), name);
        const created = payload?.hotel as
            | { id: number; name: string }
            | undefined;

        if (!created) {
            return;
        }

        setHotels((prev) => [
            ...prev,
            { id: created.id, name: created.name },
        ]);
        setData('hotel_id', created.id.toString());
    };

    const handleCreateVessel = async (name: string) => {
        const payload = await createLookupInline(toUrl(storeVessel()), name);
        const created = payload?.vessel as
            | { id: number; name: string }
            | undefined;

        if (!created) {
            return;
        }

        setVessels((prev) => [
            ...prev,
            { id: created.id, name: created.name },
        ]);
        setData('vessel_id', created.id.toString());
    };

    const handleCreateRank = async (name: string) => {
        const payload = await createLookupInline(toUrl(storeRank()), name);
        const created = payload?.rank as
            | { id: number; name: string }
            | undefined;

        if (!created) {
            return;
        }

        setRanks((prev) => [
            ...prev,
            { id: created.id, name: created.name },
        ]);
        setData('rank_id', created.id.toString());
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (isEditMode && booking) {
            put(toUrl(updateBackfill({ booking: booking.id })));

            return;
        }

        post(toUrl(storeBackfill()));
    };

    return (
        <PageLayout
            title={
                isEditMode
                    ? 'Edit Historical Booking'
                    : 'Backfill Historical Booking'
            }
            backHref="__history__"
        >
            <Head
                title={
                    isEditMode
                        ? 'Edit Historical Booking'
                        : 'Backfill Historical Booking'
                }
            />

            <div className="mx-auto w-full max-w-5xl space-y-6">
                {/* Info Banner */}
                <div className="flex items-start gap-3 rounded-lg border border-primary/20 bg-primary/5 p-4">
                    <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10">
                        <Info className="size-4 text-primary" />
                    </div>
                    <div className="flex-1 space-y-1">
                        <p className="text-sm font-medium text-foreground">
                            Recording Historical Bookings
                        </p>
                        <p className="text-sm text-muted-foreground">
                            Use this form to backfill completed bookings. The
                            system will automatically derive planned and actual
                            dates from your check-in/out timestamps.
                        </p>
                    </div>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Guest & Client Info */}
                    <Card>
                        <CardHeader>
                            <div className="flex items-center gap-2">
                                <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10">
                                    <User className="size-4 text-primary" />
                                </div>
                                <div className="flex-1">
                                    <CardTitle>Guest & Client</CardTitle>
                                    <CardDescription>
                                        Core booking information
                                    </CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="grid gap-5 sm:grid-cols-2">
                            {/* Guest */}
                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <Label htmlFor="guest_id">Guest Name</Label>
                                    <Badge
                                        variant="destructive"
                                        className="h-5 text-[10px]"
                                    >
                                        Required
                                    </Badge>
                                </div>
                                <SearchSelect
                                    options={guests}
                                    value={data.guest_id}
                                    onChange={(val) => setData('guest_id', val)}
                                    onCreateIntent={handleGuestCreate}
                                    createLabel="Create guest"
                                    placeholder="Select or create guest"
                                    error={errors.guest_id}
                                />
                                <InputError message={errors.guest_id} />
                            </div>

                            {/* Client */}
                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <Label htmlFor="client_id">Client</Label>
                                    <Badge
                                        variant="destructive"
                                        className="h-5 text-[10px]"
                                    >
                                        Required
                                    </Badge>
                                </div>
                                <SearchSelect
                                    options={initialClients}
                                    value={data.client_id}
                                    onChange={(val) => setData('client_id', val)}
                                    placeholder="Select client"
                                    error={errors.client_id}
                                />
                                <InputError message={errors.client_id} />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Vessel & Hotel Details */}
                    <Card>
                        <CardHeader>
                            <div className="flex items-center gap-2">
                                <div className="flex size-9 items-center justify-center rounded-lg bg-blue-500/10">
                                    <Ship className="size-4 text-blue-600 dark:text-blue-400" />
                                </div>
                                <div className="flex-1">
                                    <CardTitle>Vessel & Hotel</CardTitle>
                                    <CardDescription>
                                        Assignment details
                                    </CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="grid gap-5 sm:grid-cols-3">
                            {/* Vessel */}
                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <Label htmlFor="vessel_id">Vessel</Label>
                                    <Badge
                                        variant="destructive"
                                        className="h-5 text-[10px]"
                                    >
                                        Required
                                    </Badge>
                                </div>
                                <SearchSelect
                                    options={vessels}
                                    value={data.vessel_id}
                                    onChange={(val) => setData('vessel_id', val)}
                                    onCreate={handleCreateVessel}
                                    createLabel="Create vessel"
                                    placeholder="Select or create vessel"
                                    error={errors.vessel_id}
                                />
                                <InputError message={errors.vessel_id} />
                            </div>

                            {/* Rank */}
                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <Label htmlFor="rank_id">Rank</Label>
                                    <Badge
                                        variant="outline"
                                        className="h-5 text-[10px]"
                                    >
                                        Optional
                                    </Badge>
                                </div>
                                <SearchSelect
                                    options={ranks}
                                    value={data.rank_id}
                                    onChange={(val) => setData('rank_id', val)}
                                    onCreate={handleCreateRank}
                                    createLabel="Create rank"
                                    placeholder="Select or create rank"
                                    error={errors.rank_id}
                                />
                                <InputError message={errors.rank_id} />
                            </div>

                            {/* Hotel */}
                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <Label htmlFor="hotel_id">Hotel</Label>
                                    <Badge
                                        variant="outline"
                                        className="h-5 text-[10px]"
                                    >
                                        Optional
                                    </Badge>
                                </div>
                                <SearchSelect
                                    options={hotels}
                                    value={data.hotel_id}
                                    onChange={(val) => setData('hotel_id', val)}
                                    onCreate={handleCreateHotel}
                                    createLabel="Create hotel"
                                    placeholder="Select or create hotel"
                                    error={errors.hotel_id}
                                />
                                <InputError message={errors.hotel_id} />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Timeline */}
                    <Card>
                        <CardHeader>
                            <div className="flex items-center gap-2">
                                <div className="flex size-9 items-center justify-center rounded-lg bg-green-500/10">
                                    <Calendar className="size-4 text-green-600 dark:text-green-400" />
                                </div>
                                <div className="flex-1">
                                    <CardTitle>Check-in & Check-out</CardTitle>
                                    <CardDescription>
                                        Enter actual guest timeline (planned
                                        dates auto-populate)
                                    </CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="grid gap-5 sm:grid-cols-2">
                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <Label htmlFor="guest_check_in">
                                        <div className="flex items-center gap-1.5">
                                            <Clock className="size-3.5" />
                                            Checked In
                                        </div>
                                    </Label>
                                    <Badge
                                        variant="destructive"
                                        className="h-5 text-[10px]"
                                    >
                                        Required
                                    </Badge>
                                </div>
                                <Input
                                    type="datetime-local"
                                    id="guest_check_in"
                                    value={data.guest_check_in}
                                    onChange={(e) =>
                                        setData('guest_check_in', e.target.value)
                                    }
                                    className="h-11"
                                />
                                <InputError message={errors.guest_check_in} />
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <Label htmlFor="guest_check_out">
                                        <div className="flex items-center gap-1.5">
                                            <Clock className="size-3.5" />
                                            Checked Out
                                        </div>
                                    </Label>
                                    <Badge
                                        variant="outline"
                                        className="h-5 text-[10px]"
                                    >
                                        Optional
                                    </Badge>
                                </div>
                                <Input
                                    type="datetime-local"
                                    id="guest_check_out"
                                    value={data.guest_check_out}
                                    onChange={(e) =>
                                        setData('guest_check_out', e.target.value)
                                    }
                                    className="h-11"
                                />
                                <InputError message={errors.guest_check_out} />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Room Details */}
                    <Card>
                        <CardHeader>
                            <div className="flex items-center gap-2">
                                <div className="flex size-9 items-center justify-center rounded-lg bg-orange-500/10">
                                    <DoorOpen className="size-4 text-orange-600 dark:text-orange-400" />
                                </div>
                                <div className="flex-1">
                                    <CardTitle>Room Details</CardTitle>
                                    <CardDescription>
                                        Room assignment and confirmation
                                    </CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="grid gap-5 sm:grid-cols-3">
                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <Label htmlFor="single_or_twin">
                                        Room Type
                                    </Label>
                                    <Badge
                                        variant="destructive"
                                        className="h-5 text-[10px]"
                                    >
                                        Required
                                    </Badge>
                                </div>
                                <select
                                    id="single_or_twin"
                                    value={data.single_or_twin}
                                    onChange={(e) =>
                                        setData('single_or_twin', e.target.value)
                                    }
                                    className="flex h-11 w-full items-center rounded-lg border border-input bg-background px-3.5 text-sm shadow-sm transition-all hover:border-border/80 focus:border-primary/60 focus:outline-none focus:ring-2 focus:ring-primary/20"
                                >
                                    <option value="single">Single</option>
                                    <option value="twin">Twin</option>
                                    <option value="triple">Triple</option>
                                </select>
                                <InputError message={errors.single_or_twin} />
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <Label htmlFor="room_number">
                                        Room Number
                                    </Label>
                                    <Badge
                                        variant="outline"
                                        className="h-5 text-[10px]"
                                    >
                                        Optional
                                    </Badge>
                                </div>
                                <Input
                                    type="text"
                                    id="room_number"
                                    value={data.room_number}
                                    onChange={(e) =>
                                        setData('room_number', e.target.value)
                                    }
                                    placeholder="e.g. 301"
                                    className="h-11"
                                />
                                <InputError message={errors.room_number} />
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <Label htmlFor="confirmation_number">
                                        Confirmation #
                                    </Label>
                                    <Badge
                                        variant="outline"
                                        className="h-5 text-[10px]"
                                    >
                                        Optional
                                    </Badge>
                                </div>
                                <Input
                                    type="text"
                                    id="confirmation_number"
                                    value={data.confirmation_number}
                                    onChange={(e) =>
                                        setData(
                                            'confirmation_number',
                                            e.target.value,
                                        )
                                    }
                                    placeholder="e.g. ABC123"
                                    className="h-11"
                                />
                                <InputError
                                    message={errors.confirmation_number}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-3 pt-2">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => window.history.back()}
                            disabled={processing}
                            size="lg"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={processing}
                            size="lg"
                            className="min-w-[200px]"
                        >
                            {processing ? (
                                <>
                                    <Spinner className="mr-2 size-4" />
                                    Saving...
                                </>
                            ) : (
                                <>
                                    {isEditMode
                                        ? 'Update Booking'
                                        : 'Save Booking'}
                                    <ArrowRight className="ml-2 size-4" />
                                </>
                            )}
                        </Button>
                    </div>
                </form>
            </div>

            {/* Modals */}
            <GuestQuickCreateModal
                open={showGuestModal}
                initialFullName={guestModalName}
                countries={countries}
                onOpenChange={setShowGuestModal}
                onGuestCreated={handleGuestCreated}
            />
        </PageLayout>
    );
}

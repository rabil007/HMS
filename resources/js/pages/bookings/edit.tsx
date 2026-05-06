import { Head, useForm, usePage } from '@inertiajs/react';
import { ArrowRight, Check, ChevronsUpDown, Search } from 'lucide-react';
import React, { useMemo, useRef, useState } from 'react';
import { GuestQuickCreateModal } from '@/components/bookings/guest-quick-create-modal';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import PageLayout from '@/layouts/page-layout';
import { toUrl } from '@/lib/utils';
import { store as storeHotel } from '@/routes/admin/hotels';
import { store as storeRank } from '@/routes/admin/ranks';
import { store as storeVessel } from '@/routes/admin/vessels';
import { index as bookingsIndex, update as updateBooking } from '@/routes/bookings';

/* ─── Searchable Select ───────────────────────────────────────────────── */
type Option = { id: number | string; name: string };

function SearchSelect({
    options,
    value,
    onChange,
    onCreate,
    onCreateIntent,
    createLabel,
    placeholder,
    error,
    triggerClassName,
    dropdownClassName,
}: {
    options: Option[];
    value: string;
    onChange: (val: string) => void;
    onCreate?: (name: string) => Promise<void>;
    onCreateIntent?: (name: string) => void;
    createLabel?: string;
    placeholder: string;
    error?: string;
    triggerClassName?: string;
    dropdownClassName?: string;
}) {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [creating, setCreating] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    const filtered = options.filter((o) =>
        o.name.toLowerCase().includes(query.toLowerCase()),
    );
    const normalizedQuery = query.trim().toLowerCase();
    const hasExactMatch = normalizedQuery !== '' && options.some((o) => o.name.trim().toLowerCase() === normalizedQuery);
    const selected = options.find((o) => o.id.toString() === value);

    React.useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setOpen(false);
                setQuery('');
            }
        };
        document.addEventListener('mousedown', handler);

        return () => document.removeEventListener('mousedown', handler);
    }, []);

    return (
        <div ref={ref} className="relative w-full">
            <button
                type="button"
                onClick={() => setOpen((o) => !o)}
                className={
                    triggerClassName ??
                    `w-full flex items-center justify-between h-12 rounded-xl border px-4 text-[14px] transition-all bg-muted/40 ${
                        open ? 'border-primary/60 ring-2 ring-primary/20' : 'border-border/60 hover:border-border'
                    } ${error ? 'border-destructive' : ''}`
                }
            >
                <span className={selected ? 'text-foreground' : 'text-muted-foreground'}>
                    {selected ? selected.name : placeholder}
                </span>
                <ChevronsUpDown className="size-4 text-muted-foreground/60 shrink-0" />
            </button>

            {open && (
                <div
                    className={
                        dropdownClassName ??
                        'absolute z-50 mt-1.5 w-full rounded-xl border border-border/60 bg-popover shadow-xl shadow-black/20 overflow-hidden'
                    }
                >
                    <div className="flex items-center gap-2 px-3 py-2.5 border-b border-border/40">
                        <Search className="size-4 text-muted-foreground shrink-0" />
                        <input
                            autoFocus
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Search…"
                            className="flex-1 bg-transparent text-[13px] text-foreground placeholder:text-muted-foreground outline-none"
                        />
                    </div>
                    <div className="max-h-52 overflow-y-auto py-1">
                        {filtered.length === 0 ? (
                            <p className="px-4 py-3 text-[13px] text-muted-foreground">No results found.</p>
                        ) : (
                            filtered.map((o) => (
                                <button
                                    key={o.id}
                                    type="button"
                                    onClick={() => {
                                        onChange(o.id.toString());
                                        setOpen(false);
                                        setQuery('');
                                    }}
                                    className="w-full flex items-center justify-between px-4 py-2.5 text-[14px] text-foreground hover:bg-muted/60 transition-colors text-left"
                                >
                                    {o.name}
                                    {value === o.id.toString() && <Check className="size-4 text-primary shrink-0" />}
                                </button>
                            ))
                        )}
                        {(onCreateIntent ?? onCreate) && normalizedQuery !== '' && !hasExactMatch && (
                            <button
                                type="button"
                                disabled={creating}
                                onClick={async () => {
                                    const name = query.trim();

                                    if (onCreateIntent) {
                                        onCreateIntent(name);
                                        setOpen(false);
                                        setQuery('');

                                        return;
                                    }

                                    if (onCreate) {
                                        setCreating(true);
                                        await onCreate(name);
                                        setCreating(false);
                                        setOpen(false);
                                        setQuery('');
                                    }
                                }}
                                className="w-full border-t border-border/40 px-4 py-2.5 text-left text-[14px] text-primary hover:bg-primary/10 disabled:opacity-60"
                            >
                                {creating ? 'Creating…' : `Create ${createLabel ?? 'item'} "${query.trim()}"`}
                            </button>
                        )}
                    </div>
                </div>
            )}
            {error && <p className="mt-1 text-[12px] text-destructive">{error}</p>}
        </div>
    );
}

/* ─── Page ──────────────────────────────────────────────────────────── */
export default function BookingsEdit({
    booking,
    hotels,
    ranks,
    vessels,
    guests,
    countries,
}: {
    booking: any;
    hotels: any[];
    ranks: any[];
    vessels: any[];
    guests: Array<{ id: number; full_name: string; email: string | null; phone: string | null }>;
    countries: Array<{ id: number; name: string; iso2: string; dial_code: string }>;
}) {
    const { auth } = usePage<{ auth: { user: { role: string } } }>().props;
    const isAdmin = auth.user.role === 'admin';

    const [hotelItems, setHotelItems] = useState(hotels);
    const [rankItems, setRankItems] = useState(ranks);
    const [vesselItems, setVesselItems] = useState(vessels);
    const [guestItems, setGuestItems] = useState(guests);
    const toDateInput = (value: any) => {
        if (!value) {
            return '';
        }

        if (typeof value === 'string') {
            return value.split('T')[0];
        }

        return String(value);
    };

    const { data, setData, put, processing, errors } = useForm({
        hotel_id:        booking.hotel_id?.toString() ?? '',
        guest_id:        booking.guest_id?.toString() ?? '',
        check_in_date:   toDateInput(booking.check_in_date),
        check_out_date:  toDateInput(booking.check_out_date),
        rank_id:         booking.rank_id?.toString() ?? '',
        vessel_id:       booking.vessel_id?.toString() ?? '',
        single_or_twin:  booking.single_or_twin ?? '',
    });
    const [hotelCreateError, setHotelCreateError] = useState<string | null>(null);
    const [rankCreateError, setRankCreateError] = useState<string | null>(null);
    const [vesselCreateError, setVesselCreateError] = useState<string | null>(null);
    const [guestQuickCreateOpen, setGuestQuickCreateOpen] = useState(false);
    const [guestQuickCreateSeed, setGuestQuickCreateSeed] = useState('');
    const [guestQuickCreateKey, setGuestQuickCreateKey] = useState(0);
    const guestOptions: Option[] = useMemo(
        () => guestItems.map((guest) => ({ id: guest.id, name: `${guest.full_name}${guest.phone ? ` (${guest.phone})` : guest.email ? ` (${guest.email})` : ''}` })),
        [guestItems],
    );
    const hotelOptions: Option[] = useMemo(
        () => [{ id: '', name: 'No hotel' }, ...hotelItems],
        [hotelItems],
    );

    const createLookupInline = async (
        endpoint: string,
        name: string,
        setError: React.Dispatch<React.SetStateAction<string | null>>,
    ) => {
        const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') ?? '';
        setError(null);

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
            const validationMessage = payload?.errors?.name?.[0] as string | undefined;
            setError(validationMessage ?? payload?.message ?? 'Could not create item.');

            return null;
        }

        return payload;
    };

    const createHotelInline = async (name: string) => {
        const payload = await createLookupInline(toUrl(storeHotel()), name, setHotelCreateError);
        const created = payload?.hotel as { id: number; name: string } | undefined;

        if (!created) {
            return;
        }

        setHotelItems((previous) => [created, ...previous]);
        setData('hotel_id', String(created.id));
    };

    const createRankInline = async (name: string) => {
        const payload = await createLookupInline(toUrl(storeRank()), name, setRankCreateError);
        const created = payload?.rank as { id: number; name: string } | undefined;

        if (!created) {
            return;
        }

        setRankItems((previous) => [created, ...previous]);
        setData('rank_id', String(created.id));
    };

    const createVesselInline = async (name: string) => {
        const payload = await createLookupInline(toUrl(storeVessel()), name, setVesselCreateError);
        const created = payload?.vessel as { id: number; name: string } | undefined;

        if (!created) {
            return;
        }

        setVesselItems((previous) => [created, ...previous]);
        setData('vessel_id', String(created.id));
    };

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        put(toUrl(updateBooking({ booking: booking.id })));
    };

    const inputCls =
        'h-12 w-full rounded-xl border-border/60 bg-muted/40 text-[14px] px-4 focus:border-primary/60 focus:ring-2 focus:ring-primary/20 transition-all [color-scheme:light] dark:[color-scheme:dark]';

    const labelCls = 'text-[13px] font-semibold text-foreground mb-2 block';

    return (
        <PageLayout title="Edit Booking" backHref={toUrl(bookingsIndex())}>
            <Head title="Edit Booking" />

            <div className="mb-10">
                <h2 className="text-2xl font-bold text-foreground tracking-tight">Edit Booking</h2>
                <p className="text-[14px] text-muted-foreground mt-1.5">
                    Update your reservation details below.
                </p>
            </div>

            <form onSubmit={submit} className="space-y-10">

                {/* Hotel */}
                <div className="space-y-2">
                    <Label className={labelCls}>
                        Hotel Property <span className="text-[12px] font-normal text-muted-foreground ml-1">optional</span>
                    </Label>
                    <SearchSelect
                        options={hotelOptions}
                        value={data.hotel_id}
                        onChange={(val) => setData('hotel_id', val)}
                        onCreate={isAdmin ? createHotelInline : undefined}
                        createLabel="hotel"
                        placeholder="Select a hotel (optional)"
                        error={errors.hotel_id}
                    />
                    {hotelCreateError && <p className="mt-1 text-[12px] text-destructive">{hotelCreateError}</p>}
                </div>

                {/* Dates */}
                <div className="space-y-2">
                    <Label className={labelCls}>Stay Dates</Label>
                    <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5">
                        <div className="min-w-0 space-y-1.5">
                            <Input type="date" value={data.check_in_date} onChange={(e) => setData('check_in_date', e.target.value)} className={inputCls} />
                            <p className="pl-1 text-[12px] text-muted-foreground">Check-in date</p>
                            <InputError message={errors.check_in_date} />
                        </div>
                        <div className="min-w-0 space-y-1.5">
                            <Input type="date" value={data.check_out_date} onChange={(e) => setData('check_out_date', e.target.value)} className={inputCls} />
                            <p className="pl-1 text-[12px] text-muted-foreground">Check-out date</p>
                            <InputError message={errors.check_out_date} />
                        </div>
                    </div>
                </div>

                {/* Room Type */}
                <div className="space-y-2">
                    <Label className={labelCls}>
                        Room Type
                    </Label>
                    <div className="grid grid-cols-3 gap-4">
                        {['single', 'twin', 'triple'].map((type) => (
                            <button
                                key={type}
                                type="button"
                                onClick={() => setData('single_or_twin', type)}
                                className={`h-12 rounded-xl border text-[14px] font-semibold capitalize transition-all duration-150 ${
                                    data.single_or_twin === type
                                        ? 'border-primary bg-primary text-primary-foreground shadow-lg shadow-primary/25'
                                        : 'border-border/60 bg-muted/40 text-muted-foreground hover:border-primary/50 hover:text-foreground'
                                }`}
                            >
                                {type}
                            </button>
                        ))}
                    </div>
                    <InputError message={errors.single_or_twin} />
                </div>

                {/* Assignment */}
                <div className="space-y-2">
                    <Label className={labelCls}>
                        Assignment
                    </Label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <div className="space-y-1.5">
                            <SearchSelect
                                options={rankItems}
                                value={data.rank_id}
                                onChange={(val) => setData('rank_id', val)}
                                onCreate={isAdmin ? createRankInline : undefined}
                                createLabel="rank"
                                placeholder="Select rank"
                                error={errors.rank_id}
                            />
                            {rankCreateError && <p className="mt-1 text-[12px] text-destructive">{rankCreateError}</p>}
                            <p className="text-[12px] text-muted-foreground pl-1">Rank (optional)</p>
                        </div>
                        <div className="space-y-1.5">
                            <SearchSelect
                                options={vesselItems}
                                value={data.vessel_id}
                                onChange={(val) => setData('vessel_id', val)}
                                onCreate={isAdmin ? createVesselInline : undefined}
                                createLabel="vessel"
                                placeholder="Select vessel"
                                error={errors.vessel_id}
                            />
                            {vesselCreateError && <p className="mt-1 text-[12px] text-destructive">{vesselCreateError}</p>}
                            <p className="text-[12px] text-muted-foreground pl-1">Vessel</p>
                        </div>
                    </div>
                </div>

                {/* Guest */}
                <div className="space-y-2">
                    <Label className={labelCls}>Guest</Label>
                    <SearchSelect
                        options={guestOptions}
                        value={data.guest_id}
                        onChange={(val) => setData('guest_id', val)}
                        onCreateIntent={(name) => {
                            setGuestQuickCreateSeed(name);
                            setGuestQuickCreateKey((key) => key + 1);
                            setGuestQuickCreateOpen(true);
                        }}
                        createLabel="guest"
                        placeholder="Select guest"
                        error={errors.guest_id}
                    />
                    <GuestQuickCreateModal
                        key={guestQuickCreateKey}
                        open={guestQuickCreateOpen}
                        onOpenChange={setGuestQuickCreateOpen}
                        initialFullName={guestQuickCreateSeed}
                        countries={countries}
                        onGuestCreated={(guest) => {
                            setGuestItems((previous) => [guest, ...previous]);
                            setData('guest_id', String(guest.id));
                        }}
                    />
                </div>

                {/* Submit */}
                <div className="pt-2 border-t border-border/40 flex justify-end">
                    <Button
                        type="submit"
                        disabled={processing}
                        className="h-12 px-10 rounded-xl text-[14px] font-semibold shadow-lg shadow-primary/20 w-full sm:w-auto"
                    >
                        {processing ? (
                            <><Spinner className="mr-2 size-4" /> Saving…</>
                        ) : (
                            <>Save Changes <ArrowRight className="ml-2 size-4" /></>
                        )}
                    </Button>
                </div>
            </form>
        </PageLayout>
    );
}

BookingsEdit.layout = (page: React.ReactNode) => page;

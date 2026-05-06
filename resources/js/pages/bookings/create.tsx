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
import { cn, toUrl } from '@/lib/utils';
import { store as storeHotel } from '@/routes/admin/hotels';
import { store as storeRank } from '@/routes/admin/ranks';
import { store as storeVessel } from '@/routes/admin/vessels';
import { index as bookingsIndex, store as storeBooking } from '@/routes/bookings';

/* ─── Searchable Select ─────────────────────────────────────────────────── */
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

    // Close on outside click
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
            {/* Trigger */}
            <button
                type="button"
                onClick={() => setOpen((o) => !o)}
                className={
                    triggerClassName ??
                    `w-full flex items-center justify-between h-12 rounded-xl border px-4 text-[14px] transition-all bg-muted/40 ${
                        open
                            ? 'border-primary/60 ring-2 ring-primary/20'
                            : 'border-border/60 hover:border-border'
                    } ${error ? 'border-destructive' : ''}`
                }
            >
                <span className={selected ? 'text-foreground' : 'text-muted-foreground'}>
                    {selected ? selected.name : placeholder}
                </span>
                <ChevronsUpDown className="size-4 text-muted-foreground/60 shrink-0" />
            </button>

            {/* Dropdown */}
            {open && (
                <div
                    className={
                        dropdownClassName ??
                        'absolute z-50 mt-1.5 w-full rounded-xl border border-border/60 bg-popover shadow-xl shadow-black/20 overflow-hidden'
                    }
                >
                    {/* Search input */}
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

                    {/* Options */}
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
                                    {value === o.id.toString() && (
                                        <Check className="size-4 text-primary shrink-0" />
                                    )}
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

function OptionalBadge() {
    return (
        <span className="ms-1.5 align-middle rounded-md bg-muted/80 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            Optional
        </span>
    );
}

function FieldHint({ children, className }: { children: React.ReactNode; className?: string }) {
    return <p className={cn('text-[12px] leading-snug text-muted-foreground', className)}>{children}</p>;
}

function FormSectionCard({
    eyebrow,
    title,
    description,
    children,
}: {
    eyebrow?: string;
    title: string;
    description?: string;
    children: React.ReactNode;
}) {
    return (
        <section className="rounded-2xl border border-border/50 bg-card/50 p-4 shadow-sm sm:p-6 dark:bg-card/30">
            <div className="mb-4 sm:mb-5">
                {eyebrow ? (
                    <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">{eyebrow}</p>
                ) : null}
                <h3 className="text-base font-semibold text-foreground sm:text-lg">{title}</h3>
                {description ? <p className="mt-1 text-[13px] text-muted-foreground">{description}</p> : null}
            </div>
            <div className="space-y-4 sm:space-y-5">{children}</div>
        </section>
    );
}

/* ─── Page ──────────────────────────────────────────────────────────────── */
export default function BookingsCreate({
    hotels,
    ranks,
    vessels,
    guests,
    countries,
}: {
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
    const { data, setData, post, processing, errors } = useForm({
        hotel_id: '',
        guest_id: '',
        check_in_date: '',
        check_out_date: '',
        rank_id: '',
        vessel_id: '',
        single_or_twin: '',
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
        post(toUrl(storeBooking()));
    };

    const inputCls =
        'h-12 w-full min-h-12 rounded-xl border border-border/60 bg-muted/40 text-[14px] px-4 focus:border-primary/60 focus:ring-2 focus:ring-primary/20 transition-all [color-scheme:light] dark:[color-scheme:dark]';

    const fieldLabelCls = 'text-sm font-semibold text-foreground';

    return (
        <PageLayout title="New Booking" backHref={toUrl(bookingsIndex())}>
            <Head title="New Booking" />

            <div className="mx-auto w-full max-w-6xl px-0 sm:px-1">
                <header className="mb-6 sm:mb-8">
                    <h2 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">New booking request</h2>
                    <p className="mt-1.5 max-w-2xl text-[13px] leading-relaxed text-muted-foreground sm:text-[14px]">
                        Add stay details and guest. The hotel will review and confirm availability.
                    </p>
                </header>

                <form onSubmit={submit} className="grid grid-cols-1 gap-5 lg:grid-cols-12 lg:gap-6 lg:items-start">
                    <div className="flex flex-col gap-5 lg:col-span-7">
                        <FormSectionCard
                            eyebrow="Property"
                            title="Hotel"
                            description="Choose where the crew will stay. You can skip this if the property is not decided yet."
                        >
                            <div>
                                <Label htmlFor="booking_hotel" className={`${fieldLabelCls} mb-2 flex flex-wrap items-center gap-x-1`}>
                                    Hotel name
                                    <OptionalBadge />
                                </Label>
                                <div id="booking_hotel">
                                    <SearchSelect
                                        options={hotelOptions}
                                        value={data.hotel_id}
                                        onChange={(val) => setData('hotel_id', val)}
                                        onCreate={isAdmin ? createHotelInline : undefined}
                                        createLabel="hotel"
                                        placeholder="No hotel selected"
                                        error={errors.hotel_id}
                                    />
                                </div>
                                <FieldHint className="mt-2">Use “No hotel” when you only need a request on file first.</FieldHint>
                                {hotelCreateError ? <p className="mt-2 text-[12px] text-destructive">{hotelCreateError}</p> : null}
                            </div>
                        </FormSectionCard>

                        <FormSectionCard
                            eyebrow="Stay"
                            title="Dates & room"
                            description="Planned check-in, check-out, and the room configuration you need."
                        >
                            <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5">
                                <div className="min-w-0 space-y-2">
                                    <Label htmlFor="booking_check_in" className={fieldLabelCls}>
                                        Check-in
                                    </Label>
                                    <Input
                                        id="booking_check_in"
                                        type="date"
                                        value={data.check_in_date}
                                        onChange={(e) => setData('check_in_date', e.target.value)}
                                        className={inputCls}
                                    />
                                    <FieldHint>Arrival date at the hotel.</FieldHint>
                                    <InputError message={errors.check_in_date} />
                                </div>
                                <div className="min-w-0 space-y-2">
                                    <Label htmlFor="booking_check_out" className={fieldLabelCls}>
                                        Check-out
                                    </Label>
                                    <Input
                                        id="booking_check_out"
                                        type="date"
                                        value={data.check_out_date}
                                        onChange={(e) => setData('check_out_date', e.target.value)}
                                        className={inputCls}
                                    />
                                    <FieldHint>Departure date (last night in the room).</FieldHint>
                                    <InputError message={errors.check_out_date} />
                                </div>
                            </div>

                            <div>
                                <p className={`${fieldLabelCls} mb-2`}>Room type</p>
                                <FieldHint className="mb-3">Single, twin, or triple occupancy for this booking.</FieldHint>
                                <div className="flex flex-col gap-2 sm:grid sm:grid-cols-3 sm:gap-3">
                                    {['single', 'twin', 'triple'].map((type) => (
                                        <button
                                            key={type}
                                            type="button"
                                            onClick={() => setData('single_or_twin', type)}
                                            className={`min-h-12 rounded-xl border px-3 py-3 text-[14px] font-semibold capitalize transition-all duration-150 sm:py-2.5 ${
                                                data.single_or_twin === type
                                                    ? 'border-primary bg-primary text-primary-foreground shadow-md shadow-primary/20'
                                                    : 'border-border/60 bg-muted/40 text-muted-foreground hover:border-primary/40 hover:text-foreground'
                                            }`}
                                        >
                                            {type}
                                        </button>
                                    ))}
                                </div>
                                <InputError message={errors.single_or_twin} />
                            </div>
                        </FormSectionCard>
                    </div>

                    <div className="flex flex-col gap-5 lg:col-span-5">
                        <FormSectionCard
                            eyebrow="Crew"
                            title="Rank & vessel"
                            description="Link this stay to the seafarer’s rank and ship where required."
                        >
                            <div className="grid grid-cols-1 gap-4 sm:gap-5">
                                <div className="space-y-2">
                                    <Label className={`${fieldLabelCls} flex flex-wrap items-center gap-x-1`}>
                                        Rank
                                        <OptionalBadge />
                                    </Label>
                                    <SearchSelect
                                        options={rankItems}
                                        value={data.rank_id}
                                        onChange={(val) => setData('rank_id', val)}
                                        onCreate={isAdmin ? createRankInline : undefined}
                                        createLabel="rank"
                                        placeholder="Select rank"
                                        error={errors.rank_id}
                                    />
                                    {rankCreateError ? <p className="text-[12px] text-destructive">{rankCreateError}</p> : null}
                                </div>
                                <div className="space-y-2">
                                    <Label className={fieldLabelCls}>Vessel</Label>
                                    <SearchSelect
                                        options={vesselItems}
                                        value={data.vessel_id}
                                        onChange={(val) => setData('vessel_id', val)}
                                        onCreate={isAdmin ? createVesselInline : undefined}
                                        createLabel="vessel"
                                        placeholder="Select vessel"
                                        error={errors.vessel_id}
                                    />
                                    {vesselCreateError ? <p className="text-[12px] text-destructive">{vesselCreateError}</p> : null}
                                    <FieldHint>Required for this booking request.</FieldHint>
                                </div>
                            </div>
                        </FormSectionCard>

                        <FormSectionCard
                            eyebrow="Guest"
                            title="Who is staying?"
                            description="Pick an existing guest or search and use “Create guest” to add one with optional contact details."
                        >
                            <div className="space-y-2">
                                <Label className={fieldLabelCls}>Guest</Label>
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
                                    placeholder="Search or select guest"
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
                        </FormSectionCard>
                    </div>

                    <div className="rounded-2xl border border-border/40 bg-muted/20 p-4 sm:flex sm:items-center sm:justify-between sm:p-5 lg:col-span-12">
                        <p className="mb-3 text-[12px] text-muted-foreground sm:mb-0 sm:max-w-md sm:pr-4">
                            Submit sends the request to the hotel for confirmation. You can edit details later if needed.
                        </p>
                        <Button
                            type="submit"
                            disabled={processing}
                            className="h-12 w-full rounded-xl text-[14px] font-semibold shadow-md shadow-primary/20 sm:w-auto sm:min-w-[200px] sm:shrink-0"
                        >
                            {processing ? (
                                <>
                                    <Spinner className="mr-2 size-4" />
                                    Submitting…
                                </>
                            ) : (
                                <>
                                    Submit request
                                    <ArrowRight className="ml-2 size-4" />
                                </>
                            )}
                        </Button>
                    </div>
                </form>
            </div>
        </PageLayout>
    );
}

BookingsCreate.layout = (page: React.ReactNode) => page;

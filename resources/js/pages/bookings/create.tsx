import { Head, useForm, usePage } from '@inertiajs/react';
import { ArrowRight, Check, ChevronsUpDown, Search } from 'lucide-react';
import React, { useRef, useState } from 'react';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import PageLayout from '@/layouts/page-layout';
import { toUrl } from '@/lib/utils';
import { index as bookingsIndex, store as storeBooking } from '@/routes/bookings';

/* ─── Searchable Select ─────────────────────────────────────────────────── */
type Option = { id: number | string; name: string };

function SearchSelect({
    options,
    value,
    onChange,
    placeholder,
    error,
}: {
    options: Option[];
    value: string;
    onChange: (val: string) => void;
    placeholder: string;
    error?: string;
}) {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');
    const ref = useRef<HTMLDivElement>(null);

    const filtered = options.filter((o) =>
        o.name.toLowerCase().includes(query.toLowerCase()),
    );

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
                className={`w-full flex items-center justify-between h-12 rounded-xl border px-4 text-[14px] transition-all bg-muted/40 ${
                    open
                        ? 'border-primary/60 ring-2 ring-primary/20'
                        : 'border-border/60 hover:border-border'
                } ${error ? 'border-destructive' : ''}`}
            >
                <span className={selected ? 'text-foreground' : 'text-muted-foreground'}>
                    {selected ? selected.name : placeholder}
                </span>
                <ChevronsUpDown className="size-4 text-muted-foreground/60 shrink-0" />
            </button>

            {/* Dropdown */}
            {open && (
                <div className="absolute z-50 mt-1.5 w-full rounded-xl border border-border/60 bg-popover shadow-xl shadow-black/20 overflow-hidden">
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
                    </div>
                </div>
            )}
            {error && <p className="mt-1 text-[12px] text-destructive">{error}</p>}
        </div>
    );
}

/* ─── Page ──────────────────────────────────────────────────────────────── */
export default function BookingsCreate({
    hotels,
    ranks,
    vessels,
}: {
    hotels: any[];
    ranks: any[];
    vessels: any[];
}) {
    const { auth } = usePage().props as any;

    const { data, setData, post, processing, errors } = useForm({
        hotel_id: '',
        check_in_date: '',
        check_out_date: '',
        guest_name: '',
        guest_email: '',
        guest_phone: '',
        rank_id: '',
        vessel_id: '',
        single_or_twin: '',
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post(toUrl(storeBooking()));
    };

    const inputCls =
        'h-12 w-full rounded-xl border-border/60 bg-muted/40 text-[14px] px-4 focus:border-primary/60 focus:ring-2 focus:ring-primary/20 transition-all [color-scheme:light] dark:[color-scheme:dark]';

    const labelCls = 'text-[13px] font-semibold text-foreground mb-2 block';

    return (
        <PageLayout title="New Booking" backHref={toUrl(bookingsIndex())}>
            <Head title="New Booking" />

            {/* Header */}
            <div className="mb-10">
                <h2 className="text-2xl font-bold text-foreground tracking-tight">New Booking Request</h2>
                <p className="text-[14px] text-muted-foreground mt-1.5">
                    Fill in the details below. The hotel will confirm availability.
                </p>
            </div>

            <form onSubmit={submit} className="space-y-10">

                {/* ── Hotel ──────────────────────────────────────────── */}
                <div className="space-y-2">
                    <Label className={labelCls}>Hotel Property</Label>
                    <SearchSelect
                        options={hotels}
                        value={data.hotel_id}
                        onChange={(val) => setData('hotel_id', val)}
                        placeholder="Select a hotel"
                        error={errors.hotel_id}
                    />
                </div>

                {/* ── Stay Dates ─────────────────────────────────────── */}
                <div className="space-y-2">
                    <Label className={labelCls}>Stay Dates</Label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <div className="space-y-1.5">
                            <Input
                                type="date"
                                value={data.check_in_date}
                                onChange={(e) => setData('check_in_date', e.target.value)}
                                className={inputCls}
                            />
                            <p className="text-[12px] text-muted-foreground pl-1">Check-in date</p>
                            <InputError message={errors.check_in_date} />
                        </div>
                        <div className="space-y-1.5">
                            <Input
                                type="date"
                                value={data.check_out_date}
                                onChange={(e) => setData('check_out_date', e.target.value)}
                                className={inputCls}
                            />
                            <p className="text-[12px] text-muted-foreground pl-1">Check-out date</p>
                            <InputError message={errors.check_out_date} />
                        </div>
                    </div>
                </div>

                {/* ── Room Type ──────────────────────────────────────── */}
                <div className="space-y-2">
                    <Label className={labelCls}>
                        Room Type{' '}
                        <span className="text-[12px] font-normal text-muted-foreground ml-1">optional</span>
                    </Label>
                    <div className="grid grid-cols-2 gap-4">
                        {['single', 'twin'].map((type) => (
                            <button
                                key={type}
                                type="button"
                                onClick={() =>
                                    setData('single_or_twin', data.single_or_twin === type ? '' : type)
                                }
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

                {/* ── Rank & Vessel ──────────────────────────────────── */}
                <div className="space-y-2">
                    <Label className={labelCls}>
                        Assignment{' '}
                        <span className="text-[12px] font-normal text-muted-foreground ml-1">optional</span>
                    </Label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <div className="space-y-1.5">
                            <SearchSelect
                                options={ranks}
                                value={data.rank_id}
                                onChange={(val) => setData('rank_id', val)}
                                placeholder="Select rank"
                                error={errors.rank_id}
                            />
                            <p className="text-[12px] text-muted-foreground pl-1">Rank</p>
                        </div>
                        <div className="space-y-1.5">
                            <SearchSelect
                                options={vessels}
                                value={data.vessel_id}
                                onChange={(val) => setData('vessel_id', val)}
                                placeholder="Select vessel"
                                error={errors.vessel_id}
                            />
                            <p className="text-[12px] text-muted-foreground pl-1">Vessel</p>
                        </div>
                    </div>
                </div>

                {/* ── Guest Info ─────────────────────────────────────── */}
                <div className="space-y-2">
                    <Label className={labelCls}>Guest Info</Label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <div className="space-y-1.5">
                            <Input
                                type="text"
                                value={data.guest_name}
                                onChange={(e) => setData('guest_name', e.target.value)}
                                placeholder="Full name"
                                className={inputCls}
                            />
                            <InputError message={errors.guest_name} />
                        </div>
                        <div className="space-y-1.5">
                            <Input
                                type="email"
                                value={data.guest_email}
                                onChange={(e) => setData('guest_email', e.target.value)}
                                placeholder="guest@example.com"
                                className={inputCls}
                            />
                            <InputError message={errors.guest_email} />
                        </div>
                    </div>

                    <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <div className="space-y-1.5">
                            <Input
                                type="tel"
                                value={data.guest_phone}
                                onChange={(e) => setData('guest_phone', e.target.value)}
                                placeholder="+1 234 567 890"
                                className={inputCls}
                            />
                            <p className="text-[12px] text-muted-foreground pl-1">Phone number</p>
                            <InputError message={errors.guest_phone} />
                        </div>
                    </div>
                </div>

                {/* ── Submit ─────────────────────────────────────────── */}
                <div className="pt-2 border-t border-border/40 flex justify-end">
                    <Button
                        type="submit"
                        disabled={processing}
                        className="h-12 px-10 rounded-xl text-[14px] font-semibold shadow-lg shadow-primary/20 w-full sm:w-auto"
                    >
                        {processing ? (
                            <>
                                <Spinner className="mr-2 size-4" />
                                Submitting…
                            </>
                        ) : (
                            <>
                                Submit Request
                                <ArrowRight className="ml-2 size-4" />
                            </>
                        )}
                    </Button>
                </div>
            </form>
        </PageLayout>
    );
}

BookingsCreate.layout = (page: React.ReactNode) => page;

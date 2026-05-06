import React, { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { toUrl } from '@/lib/utils';
import { store as storeGuest } from '@/routes/guests';

export type GuestQuickCountry = { id: number; name: string; iso2: string; dial_code: string };

export type CreatedGuest = { id: number; full_name: string; email: string | null; phone: string | null };

type FieldErrors = Partial<Record<'full_name' | 'email' | 'phone', string>>;

const inputCls =
    'h-12 w-full rounded-xl border-border/60 bg-muted/40 text-[14px] px-4 focus:border-primary/60 focus:ring-2 focus:ring-primary/20 transition-all [color-scheme:light] dark:[color-scheme:dark]';

type GuestQuickCreateModalProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    initialFullName: string;
    countries: GuestQuickCountry[];
    onGuestCreated: (guest: CreatedGuest) => void;
};

export function GuestQuickCreateModal({
    open,
    onOpenChange,
    initialFullName,
    countries,
    onGuestCreated,
}: GuestQuickCreateModalProps) {
    const defaultCountryId = useMemo(() => {
        const uae = countries.find((country) => String(country.iso2).toUpperCase() === 'AE');

        return uae ? String(uae.id) : (countries[0] ? String(countries[0].id) : '');
    }, [countries]);

    const [fullName, setFullName] = useState(() => initialFullName.trim());
    const [email, setEmail] = useState('');
    const [countryId, setCountryId] = useState<string>(() => defaultCountryId);
    const [localPhone, setLocalPhone] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
    const [submitError, setSubmitError] = useState<string | null>(null);

    const selectedCountry = useMemo(() => {
        const idNum = Number(countryId);

        return countries.find((country) => country.id === idNum) ?? null;
    }, [countries, countryId]);

    const fullPhone = useMemo(() => {
        const dialCode = selectedCountry?.dial_code ?? '';
        const localDigits = localPhone.replace(/[^\d]/g, '');

        return dialCode !== '' && localDigits !== '' ? `${dialCode}${localDigits}` : '';
    }, [localPhone, selectedCountry?.dial_code]);

    const submit = async () => {
        const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') ?? '';
        setSubmitting(true);
        setFieldErrors({});
        setSubmitError(null);

        const response = await fetch(toUrl(storeGuest()), {
            method: 'POST',
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': csrfToken,
                'X-Requested-With': 'XMLHttpRequest',
            },
            body: JSON.stringify({
                full_name: fullName.trim(),
                email: email.trim() !== '' ? email.trim() : null,
                phone: fullPhone !== '' ? fullPhone : null,
            }),
        });

        const payload = await response.json().catch(() => null);

        if (!response.ok) {
            setSubmitting(false);
            const errors = (payload?.errors ?? {}) as Record<string, string[]>;
            const next: FieldErrors = {};

            if (errors.full_name?.[0]) {
                next.full_name = errors.full_name[0];
            }

            if (errors.email?.[0]) {
                next.email = errors.email[0];
            }

            if (errors.phone?.[0]) {
                next.phone = errors.phone[0];
            }

            setFieldErrors(next);
            setSubmitError(
                typeof payload?.message === 'string' ? payload.message : 'Could not create guest.',
            );

            return;
        }

        const guest = payload?.guest as CreatedGuest | undefined;

        setSubmitting(false);

        if (!guest) {
            setSubmitError('Guest created but could not be selected.');

            return;
        }

        onGuestCreated(guest);
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>New guest</DialogTitle>
                    <DialogDescription>Add contact details — email and phone are optional.</DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-2">
                    <div className="space-y-1.5">
                        <Label htmlFor="guest_quick_full_name">Full name</Label>
                        <Input
                            id="guest_quick_full_name"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            autoFocus
                            className={inputCls}
                            autoComplete="name"
                        />
                        {fieldErrors.full_name && (
                            <p className="text-[12px] text-destructive">{fieldErrors.full_name}</p>
                        )}
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="guest_quick_email">
                            Email <span className="text-[11px] font-normal text-muted-foreground">optional</span>
                        </Label>
                        <Input
                            id="guest_quick_email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className={inputCls}
                            placeholder="guest@example.com"
                            autoComplete="email"
                        />
                        {fieldErrors.email && <p className="text-[12px] text-destructive">{fieldErrors.email}</p>}
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="guest_quick_phone_local">
                            Phone <span className="text-[11px] font-normal text-muted-foreground">optional</span>
                        </Label>
                        <div className="flex h-12 w-full overflow-hidden rounded-xl border border-border/60 bg-muted/40 focus-within:border-primary/60 focus-within:ring-2 focus-within:ring-primary/20">
                            <select
                                value={countryId}
                                onChange={(e) => setCountryId(e.target.value)}
                                className="h-12 w-48 shrink-0 border-0 border-r border-border/60 bg-transparent px-3 text-[13px] outline-none sm:w-52"
                            >
                                {countries.map((country) => (
                                    <option key={country.id} value={String(country.id)}>
                                        {country.name} ({country.dial_code})
                                    </option>
                                ))}
                            </select>
                            <Input
                                id="guest_quick_phone_local"
                                type="tel"
                                value={localPhone}
                                onChange={(e) => setLocalPhone(e.target.value)}
                                placeholder={selectedCountry?.dial_code ? `${selectedCountry.dial_code} 50 123 4567` : 'Phone'}
                                className="h-12 w-full min-w-0 border-0 bg-transparent text-[14px] px-3 focus-visible:ring-0 focus-visible:ring-offset-0 sm:px-4"
                                autoComplete="tel-national"
                            />
                        </div>
                        {fieldErrors.phone && (
                            <p className="text-[12px] text-destructive">{fieldErrors.phone}</p>
                        )}
                    </div>

                    {submitError && !(fieldErrors.full_name ?? fieldErrors.email ?? fieldErrors.phone) && (
                        <p className="text-[12px] text-destructive">{submitError}</p>
                    )}
                </div>

                <DialogFooter className="gap-2">
                    <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
                        Cancel
                    </Button>
                    <Button type="button" onClick={() => submit()} disabled={submitting}>
                        {submitting ? (
                            <>
                                <Spinner className="mr-2 size-4" />
                                Creating…
                            </>
                        ) : (
                            'Create & select guest'
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

import { Head, useForm } from '@inertiajs/react';
import { ArrowRight } from 'lucide-react';
import React, { useMemo, useState } from 'react';
import { FormActions, FormPageHeader, formInputClassName, formLabelClassName } from '@/components/forms/form-page';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import PageLayout from '@/layouts/page-layout';
import { toUrl } from '@/lib/utils';
import { index as guestsIndex, store } from '@/routes/guests';

type Country = { id: number; name: string; iso2: string; dial_code: string };

export default function GuestsCreate({
    redirect_to_booking = false,
    countries,
}: {
    redirect_to_booking?: boolean;
    countries: Country[];
}) {
    const { data, setData, post, processing, errors } = useForm({
        full_name: '',
        email: '',
        phone: '',
        notes: '',
        redirect_to_booking,
    });

    const defaultCountryId = useMemo(() => {
        const uae = countries.find((country) => String(country.iso2).toUpperCase() === 'AE');

        return uae ? String(uae.id) : (countries[0] ? String(countries[0].id) : '');
    }, [countries]);

    const [countryId, setCountryId] = useState<string>(defaultCountryId);
    const [localPhone, setLocalPhone] = useState<string>('');

    const selectedCountry = useMemo(() => {
        const idNum = Number(countryId);

        return countries.find((country) => country.id === idNum) ?? null;
    }, [countries, countryId]);

    React.useEffect(() => {
        const dialCode = selectedCountry?.dial_code ?? '';
        const localDigits = localPhone.replace(/[^\d]/g, '');
        const fullPhone = dialCode && localDigits ? `${dialCode}${localDigits}` : '';
        setData('phone', fullPhone);
    }, [localPhone, selectedCountry?.dial_code, setData]);

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post(toUrl(store()));
    };

    return (
        <PageLayout title="New Guest" backHref={toUrl(guestsIndex())}>
            <Head title="New Guest" />

            <FormPageHeader title="New Guest" description="Add a new guest record. Email and phone are optional but must be unique when set." />

            <form onSubmit={submit} className="space-y-8">
                <div className="space-y-2">
                    <Label htmlFor="full_name" className={formLabelClassName()}>
                        Full Name
                    </Label>
                    <Input
                        id="full_name"
                        value={data.full_name}
                        onChange={(e) => setData('full_name', e.target.value)}
                        className={formInputClassName()}
                    />
                    <InputError message={errors.full_name} />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div className="space-y-2">
                        <Label htmlFor="email" className={formLabelClassName()}>
                            Email <span className="text-[12px] font-normal text-muted-foreground ml-1">optional</span>
                        </Label>
                        <Input
                            id="email"
                            type="email"
                            value={data.email}
                            onChange={(e) => setData('email', e.target.value)}
                            placeholder="guest@example.com"
                            className={formInputClassName()}
                        />
                        <InputError message={errors.email} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="phone_local" className={formLabelClassName()}>
                            Phone <span className="text-[12px] font-normal text-muted-foreground ml-1">optional</span>
                        </Label>
                        <div className="flex h-12 w-full overflow-hidden rounded-xl border border-border/60 bg-muted/40 focus-within:border-primary/60 focus-within:ring-2 focus-within:ring-primary/20">
                            <select
                                value={countryId}
                                onChange={(e) => setCountryId(e.target.value)}
                                className="h-12 w-52 border-0 border-r border-border/60 bg-transparent px-3 text-[14px] outline-none"
                            >
                                {countries.map((country) => (
                                    <option key={country.id} value={String(country.id)}>
                                        {country.name} ({country.dial_code})
                                    </option>
                                ))}
                            </select>
                            <Input
                                id="phone_local"
                                type="tel"
                                value={localPhone}
                                onChange={(e) => setLocalPhone(e.target.value)}
                                placeholder={selectedCountry?.dial_code ? `${selectedCountry.dial_code} 50 123 4567` : 'Phone number'}
                                className="h-12 w-full border-0 bg-transparent text-[14px] px-4 focus-visible:ring-0 focus-visible:ring-offset-0"
                            />
                        </div>
                        <InputError message={errors.phone} />
                    </div>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="notes" className={formLabelClassName()}>
                        Notes <span className="text-[12px] font-normal text-muted-foreground ml-1">optional</span>
                    </Label>
                    <textarea
                        id="notes"
                        value={data.notes}
                        onChange={(e) => setData('notes', e.target.value)}
                        rows={3}
                        className="w-full rounded-xl border border-border/60 bg-muted/40 text-[14px] px-4 py-3 outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/20 transition-all"
                    />
                    <InputError message={errors.notes} />
                </div>

                <FormActions>
                    <Button
                        type="submit"
                        disabled={processing}
                        className="h-12 px-10 rounded-xl text-[14px] font-semibold shadow-lg shadow-primary/20 w-full sm:w-auto"
                    >
                        Create Guest <ArrowRight className="ml-2 size-4" />
                    </Button>
                </FormActions>
            </form>
        </PageLayout>
    );
}

GuestsCreate.layout = (page: React.ReactNode) => page;

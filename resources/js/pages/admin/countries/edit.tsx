import { Head, useForm } from '@inertiajs/react';
import { ArrowRight } from 'lucide-react';
import React from 'react';
import { FormActions, FormPageHeader, formInputClassName, formLabelClassName } from '@/components/forms/form-page';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import PageLayout from '@/layouts/page-layout';
import { toUrl } from '@/lib/utils';
import { index as countriesIndex, update } from '@/routes/admin/countries';

export default function CountriesEdit({ country }: { country: { id: number; name: string; iso2: string; dial_code: string } }) {
    const { data, setData, put, processing, errors } = useForm({
        name: country.name,
        iso2: country.iso2,
        dial_code: country.dial_code,
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        put(toUrl(update({ country: country.id })));
    };

    return (
        <PageLayout title="Edit Country" backHref={toUrl(countriesIndex())}>
            <Head title="Edit Country" />

            <FormPageHeader title="Edit Country" description="Update the country details." />

            <form onSubmit={submit} className="space-y-10">
                <div className="space-y-2 max-w-xl">
                    <Label htmlFor="name" className={formLabelClassName()}>Name</Label>
                    <Input
                        id="name"
                        value={data.name}
                        onChange={(e) => setData('name', e.target.value)}
                        className={formInputClassName()}
                    />
                    <InputError message={errors.name} />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-xl">
                    <div className="space-y-2">
                        <Label htmlFor="iso2" className={formLabelClassName()}>ISO2</Label>
                        <Input
                            id="iso2"
                            value={data.iso2}
                            onChange={(e) => setData('iso2', e.target.value.toUpperCase())}
                            className={formInputClassName()}
                            maxLength={2}
                        />
                        <InputError message={errors.iso2} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="dial_code" className={formLabelClassName()}>Dial code</Label>
                        <Input
                            id="dial_code"
                            value={data.dial_code}
                            onChange={(e) => setData('dial_code', e.target.value)}
                            className={formInputClassName()}
                        />
                        <InputError message={errors.dial_code} />
                    </div>
                </div>

                <FormActions>
                    <Button
                        type="submit"
                        disabled={processing}
                        className="h-12 px-10 rounded-xl text-[14px] font-semibold shadow-lg shadow-primary/20 w-full sm:w-auto"
                    >
                        Save Changes <ArrowRight className="ml-2 size-4" />
                    </Button>
                </FormActions>
            </form>
        </PageLayout>
    );
}

CountriesEdit.layout = (page: React.ReactNode) => page;


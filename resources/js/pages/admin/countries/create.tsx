import { Head, useForm } from '@inertiajs/react';
import { ArrowRight } from 'lucide-react';
import React from 'react';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FormActions, FormPageHeader, formInputClassName, formLabelClassName } from '@/components/forms/form-page';
import PageLayout from '@/layouts/page-layout';
import { toUrl } from '@/lib/utils';
import { index as countriesIndex, store } from '@/routes/admin/countries';

export default function CountriesCreate() {
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        iso2: '',
        dial_code: '',
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post(toUrl(store()));
    };

    return (
        <PageLayout title="New Country" backHref={toUrl(countriesIndex())}>
            <Head title="New Country" />

            <FormPageHeader title="New Country" description="Create a new country with its ISO2 and dial code." />

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
                            placeholder="AE"
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
                            placeholder="+971"
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
                        Create Country <ArrowRight className="ml-2 size-4" />
                    </Button>
                </FormActions>
            </form>
        </PageLayout>
    );
}

CountriesCreate.layout = (page: React.ReactNode) => page;


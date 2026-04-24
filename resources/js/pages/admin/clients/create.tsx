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
import { index as clientsIndex, store } from '@/routes/admin/clients';

export default function RoleClientsCreate() {
    const { data, setData, post, processing, errors } = useForm({
        name: '',
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post(toUrl(store()));
    };

    return (
        <PageLayout title="New Client" backHref={toUrl(clientsIndex())}>
            <Head title="New Client" />

            <FormPageHeader title="New Client" description="Create a new client company." />

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

                <FormActions>
                    <Button
                        type="submit"
                        disabled={processing}
                        className="h-12 px-10 rounded-xl text-[14px] font-semibold shadow-lg shadow-primary/20 w-full sm:w-auto"
                    >
                        Create Client <ArrowRight className="ml-2 size-4" />
                    </Button>
                </FormActions>
            </form>
        </PageLayout>
    );
}

RoleClientsCreate.layout = (page: React.ReactNode) => page;


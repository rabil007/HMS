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
import { index as clientsIndex, update } from '@/routes/admin/clients';

export default function RoleClientsEdit({ client }: { client: { id: number; name: string } }) {
    const { data, setData, put, processing, errors } = useForm({
        name: client.name,
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        put(toUrl(update({ client: client.id })));
    };

    return (
        <PageLayout title="Edit Client" backHref={toUrl(clientsIndex())}>
            <Head title="Edit Client" />

            <FormPageHeader title="Edit Client" description="Update the client details." />

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
                        Save Changes <ArrowRight className="ml-2 size-4" />
                    </Button>
                </FormActions>
            </form>
        </PageLayout>
    );
}

RoleClientsEdit.layout = (page: React.ReactNode) => page;


import { Head, Link, useForm } from '@inertiajs/react';
import React from 'react';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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

            <form onSubmit={submit} className="max-w-xl space-y-6">
                <div className="space-y-2">
                    <Label htmlFor="name">Name</Label>
                    <Input
                        id="name"
                        value={data.name}
                        onChange={(e) => setData('name', e.target.value)}
                        className="rounded-2xl"
                    />
                    <InputError message={errors.name} />
                </div>

                <div className="flex items-center gap-3">
                    <Button type="submit" disabled={processing} className="rounded-full">
                        Create
                    </Button>
                    <Button asChild type="button" variant="outline" className="rounded-full">
                        <Link href={toUrl(clientsIndex())}>Cancel</Link>
                    </Button>
                </div>
            </form>
        </PageLayout>
    );
}

RoleClientsCreate.layout = (page: React.ReactNode) => page;


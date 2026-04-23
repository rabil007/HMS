import { Head, Link, useForm } from '@inertiajs/react';
import React from 'react';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import PageLayout from '@/layouts/page-layout';
import { toUrl } from '@/lib/utils';
import { index as vesselsIndex, update } from '@/routes/role/vessels';

export default function RoleVesselsEdit({ vessel }: { vessel: { id: number; name: string } }) {
    const { data, setData, put, processing, errors } = useForm({
        name: vessel.name,
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        put(toUrl(update({ vessel: vessel.id })));
    };

    return (
        <PageLayout title="Edit Vessel" backHref={toUrl(vesselsIndex())}>
            <Head title="Edit Vessel" />

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
                        Save
                    </Button>
                    <Button asChild type="button" variant="outline" className="rounded-full">
                        <Link href={toUrl(vesselsIndex())}>Cancel</Link>
                    </Button>
                </div>
            </form>
        </PageLayout>
    );
}

RoleVesselsEdit.layout = (page: React.ReactNode) => page;


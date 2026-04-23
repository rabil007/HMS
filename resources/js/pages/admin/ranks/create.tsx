import { Head, Link, useForm } from '@inertiajs/react';
import React from 'react';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import PageLayout from '@/layouts/page-layout';
import { toUrl } from '@/lib/utils';
import { index as ranksIndex, store } from '@/routes/admin/ranks';

export default function RoleRanksCreate() {
    const { data, setData, post, processing, errors } = useForm({
        name: '',
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post(toUrl(store()));
    };

    return (
        <PageLayout title="New Rank" backHref={toUrl(ranksIndex())}>
            <Head title="New Rank" />

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
                        <Link href={toUrl(ranksIndex())}>Cancel</Link>
                    </Button>
                </div>
            </form>
        </PageLayout>
    );
}

RoleRanksCreate.layout = (page: React.ReactNode) => page;


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
import { index as ranksIndex, update } from '@/routes/admin/ranks';

export default function RoleRanksEdit({ rank }: { rank: { id: number; name: string } }) {
    const { data, setData, put, processing, errors } = useForm({
        name: rank.name,
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        put(toUrl(update({ rank: rank.id })));
    };

    return (
        <PageLayout title="Edit Rank" backHref={toUrl(ranksIndex())}>
            <Head title="Edit Rank" />

            <FormPageHeader title="Edit Rank" description="Update the rank details." />

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

RoleRanksEdit.layout = (page: React.ReactNode) => page;


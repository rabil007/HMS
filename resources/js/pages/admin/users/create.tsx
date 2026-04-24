import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowRight } from 'lucide-react';
import React, { useEffect } from 'react';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FormActions, FormPageHeader, formInputClassName, formLabelClassName } from '@/components/forms/form-page';
import PageLayout from '@/layouts/page-layout';
import { toUrl } from '@/lib/utils';
import { index as usersIndex, store } from '@/routes/admin/users';

type Option = { id: number; name: string };

export default function UsersCreate({
    roles,
    hotels,
    clients,
}: {
    roles: string[];
    hotels: Option[];
    clients: Option[];
}) {
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        email: '',
        password: '',
        role: 'client',
        hotel_id: '',
        client_id: '',
    });

    useEffect(() => {
        if (data.role !== 'hotel' && data.hotel_id) {
            setData('hotel_id', '');
        }
        if (data.role !== 'client' && data.client_id) {
            setData('client_id', '');
        }
    }, [data.role]);

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post(toUrl(store()));
    };

    return (
        <PageLayout title="New User" backHref={toUrl(usersIndex())}>
            <Head title="New User" />

            <FormPageHeader title="New User" description="Create a new platform user and assign a role." />

            <form onSubmit={submit} className="space-y-10">
                <div className="space-y-2">
                    <Label className={formLabelClassName()}>User Info</Label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <div className="space-y-1.5">
                            <Input id="name" value={data.name} onChange={(e) => setData('name', e.target.value)} className={formInputClassName()} placeholder="Full name" />
                            <InputError message={errors.name} />
                        </div>
                        <div className="space-y-1.5">
                            <Input id="email" type="email" value={data.email} onChange={(e) => setData('email', e.target.value)} className={formInputClassName()} placeholder="user@example.com" />
                            <InputError message={errors.email} />
                        </div>
                    </div>
                    <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <div className="space-y-1.5">
                            <Input id="password" type="password" value={data.password} onChange={(e) => setData('password', e.target.value)} className={formInputClassName()} placeholder="Password" />
                            <InputError message={errors.password} />
                        </div>
                    </div>
                </div>

                <div className="space-y-2">
                    <Label className={formLabelClassName()}>Role</Label>
                    <div className="flex flex-wrap items-center gap-2">
                        {roles.map((r) => (
                            <button
                                key={r}
                                type="button"
                                onClick={() => setData('role', data.role === r ? 'client' : r)}
                                className={[
                                    'h-11 px-4 rounded-xl border text-[13px] font-semibold transition-colors capitalize',
                                    data.role === r
                                        ? 'border-primary bg-primary text-primary-foreground shadow-md shadow-primary/20'
                                        : 'border-border/60 bg-muted/40 text-muted-foreground hover:text-foreground hover:border-border',
                                ].join(' ')}
                            >
                                {r}
                            </button>
                        ))}
                    </div>
                    <InputError message={errors.role} />
                </div>

                {(data.role === 'hotel' || data.role === 'client') && (
                    <div className="space-y-2">
                        <Label className={formLabelClassName()}>
                            Assignment <span className="text-[12px] font-normal text-muted-foreground ml-1">optional</span>
                        </Label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                            {data.role === 'hotel' && (
                                <div className="space-y-1.5">
                                    <Select value={data.hotel_id} onValueChange={(val) => setData('hotel_id', val)}>
                                        <SelectTrigger className={formInputClassName()}>
                                            <SelectValue placeholder="Select hotel" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {hotels.map((h) => (
                                                <SelectItem key={h.id} value={h.id.toString()}>
                                                    {h.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <p className="text-[12px] text-muted-foreground pl-1">Hotel</p>
                                    <InputError message={errors.hotel_id} />
                                </div>
                            )}

                            {data.role === 'client' && (
                                <div className="space-y-1.5">
                                    <Select value={data.client_id} onValueChange={(val) => setData('client_id', val)}>
                                        <SelectTrigger className={formInputClassName()}>
                                            <SelectValue placeholder="Select client" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {clients.map((c) => (
                                                <SelectItem key={c.id} value={c.id.toString()}>
                                                    {c.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <p className="text-[12px] text-muted-foreground pl-1">Client company</p>
                                    <InputError message={errors.client_id} />
                                </div>
                            )}
                        </div>
                    </div>
                )}

                <FormActions>
                    <Button
                        type="submit"
                        disabled={processing}
                        className="h-12 px-10 rounded-xl text-[14px] font-semibold shadow-lg shadow-primary/20 w-full sm:w-auto"
                    >
                        Create User <ArrowRight className="ml-2 size-4" />
                    </Button>
                </FormActions>
            </form>
        </PageLayout>
    );
}

UsersCreate.layout = (page: React.ReactNode) => page;


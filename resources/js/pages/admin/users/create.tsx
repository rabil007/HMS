import { Head, Link, useForm } from '@inertiajs/react';
import React, { useEffect } from 'react';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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

            <form onSubmit={submit} className="max-w-xl space-y-6">
                <div className="space-y-2">
                    <Label htmlFor="name">Name</Label>
                    <Input id="name" value={data.name} onChange={(e) => setData('name', e.target.value)} className="rounded-2xl" />
                    <InputError message={errors.name} />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" value={data.email} onChange={(e) => setData('email', e.target.value)} className="rounded-2xl" />
                    <InputError message={errors.email} />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input id="password" type="password" value={data.password} onChange={(e) => setData('password', e.target.value)} className="rounded-2xl" />
                    <InputError message={errors.password} />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="role">Role</Label>
                    <Select value={data.role} onValueChange={(val) => setData('role', val)}>
                        <SelectTrigger className="rounded-2xl">
                            <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                        <SelectContent>
                            {roles.map((r) => (
                                <SelectItem key={r} value={r}>
                                    {r}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <InputError message={errors.role} />
                </div>

                {data.role === 'hotel' && (
                    <div className="space-y-2">
                        <Label htmlFor="hotel_id">Hotel</Label>
                        <Select value={data.hotel_id} onValueChange={(val) => setData('hotel_id', val)}>
                            <SelectTrigger className="rounded-2xl">
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
                        <InputError message={errors.hotel_id} />
                    </div>
                )}

                {data.role === 'client' && (
                    <div className="space-y-2">
                        <Label htmlFor="client_id">Client company</Label>
                        <Select value={data.client_id} onValueChange={(val) => setData('client_id', val)}>
                            <SelectTrigger className="rounded-2xl">
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
                        <InputError message={errors.client_id} />
                    </div>
                )}

                <div className="flex items-center gap-3">
                    <Button type="submit" disabled={processing} className="rounded-full">
                        Create
                    </Button>
                    <Button asChild type="button" variant="outline" className="rounded-full">
                        <Link href={toUrl(usersIndex())}>Cancel</Link>
                    </Button>
                </div>
            </form>
        </PageLayout>
    );
}

UsersCreate.layout = (page: React.ReactNode) => page;


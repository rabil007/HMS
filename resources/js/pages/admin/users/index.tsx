import { Head, Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import PageLayout from '@/layouts/page-layout';
import { toUrl } from '@/lib/utils';
import { dashboard } from '@/routes';
import { create, destroy, edit } from '@/routes/admin/users';

type UserRow = {
    id: number;
    name: string;
    email: string;
    role: string;
};

export default function UsersIndex({ users }: { users: UserRow[] }) {
    return (
        <PageLayout title="Users" backHref={toUrl(dashboard())}>
            <Head title="Users" />

            <div className="flex items-center justify-between gap-4 mb-8">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Users</h2>
                    <p className="text-muted-foreground mt-2">Manage platform users.</p>
                </div>

                <Button asChild className="rounded-full">
                    <Link href={toUrl(create())}>New User</Link>
                </Button>
            </div>

            <div className="rounded-2xl border border-border/80 bg-card/60 backdrop-blur-xl overflow-hidden">
                <div className="divide-y divide-border/60">
                    {users.length === 0 ? (
                        <div className="p-6 text-muted-foreground">No users yet.</div>
                    ) : (
                        users.map((user) => (
                            <div key={user.id} className="p-6 flex items-center justify-between gap-4">
                                <div className="min-w-0">
                                    <div className="font-medium truncate">{user.name}</div>
                                    <div className="text-sm text-muted-foreground truncate">{user.email}</div>
                                </div>

                                <div className="flex items-center gap-3">
                                    <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                        {user.role}
                                    </span>

                                    <div className="flex items-center gap-2">
                                        <Button asChild variant="outline" className="rounded-full">
                                            <Link href={toUrl(edit({ user: user.id }))}>Edit</Link>
                                        </Button>
                                        <Button variant="destructive" className="rounded-full" asChild>
                                            <Link href={toUrl(destroy({ user: user.id }))} method="delete" as="button">
                                                Delete
                                            </Link>
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </PageLayout>
    );
}

UsersIndex.layout = (page: React.ReactNode) => page;


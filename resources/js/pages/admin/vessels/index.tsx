import { Head, Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import PageLayout from '@/layouts/page-layout';
import { toUrl } from '@/lib/utils';
import { index as adminIndex } from '@/routes/admin';
import { create, destroy, edit } from '@/routes/admin/vessels';

export default function RoleVesselsIndex({ vessels }: { vessels: { id: number; name: string }[] }) {
    return (
        <PageLayout title="Vessels" backHref={toUrl(adminIndex())}>
            <Head title="Vessels" />

            <div className="flex items-center justify-between gap-4 mb-8">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Vessels</h2>
                    <p className="text-muted-foreground mt-2">Reference vessels used in booking requests.</p>
                </div>

                <Button asChild className="rounded-full">
                    <Link href={toUrl(create())}>New Vessel</Link>
                </Button>
            </div>

            <div className="rounded-2xl border border-border/80 bg-card/60 backdrop-blur-xl overflow-hidden">
                <div className="divide-y divide-border/60">
                    {vessels.length === 0 ? (
                        <div className="p-6 text-muted-foreground">No vessels yet.</div>
                    ) : (
                        vessels.map((vessel) => (
                            <div key={vessel.id} className="p-6 flex items-center justify-between gap-4">
                                <div className="font-medium">{vessel.name}</div>
                                <div className="flex items-center gap-2">
                                    <Button asChild variant="outline" className="rounded-full">
                                        <Link href={toUrl(edit({ vessel: vessel.id }))}>Edit</Link>
                                    </Button>
                                    <Button variant="destructive" className="rounded-full" asChild>
                                        <Link href={toUrl(destroy({ vessel: vessel.id }))} method="delete" as="button">
                                            Delete
                                        </Link>
                                    </Button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </PageLayout>
    );
}

RoleVesselsIndex.layout = (page: React.ReactNode) => page;


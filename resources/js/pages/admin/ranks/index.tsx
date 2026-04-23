import { Head, Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import PageLayout from '@/layouts/page-layout';
import { toUrl } from '@/lib/utils';
import { index as adminIndex } from '@/routes/admin';
import { create, destroy, edit } from '@/routes/admin/ranks';

export default function RoleRanksIndex({ ranks }: { ranks: { id: number; name: string }[] }) {
    return (
        <PageLayout title="Ranks" backHref={toUrl(adminIndex())}>
            <Head title="Ranks" />

            <div className="flex items-center justify-between gap-4 mb-8">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Ranks</h2>
                    <p className="text-muted-foreground mt-2">Reference ranks used in booking requests.</p>
                </div>

                <Button asChild className="rounded-full">
                    <Link href={toUrl(create())}>New Rank</Link>
                </Button>
            </div>

            <div className="rounded-2xl border border-border/80 bg-card/60 backdrop-blur-xl overflow-hidden">
                <div className="divide-y divide-border/60">
                    {ranks.length === 0 ? (
                        <div className="p-6 text-muted-foreground">No ranks yet.</div>
                    ) : (
                        ranks.map((rank) => (
                            <div key={rank.id} className="p-6 flex items-center justify-between gap-4">
                                <div className="font-medium">{rank.name}</div>
                                <div className="flex items-center gap-2">
                                    <Button asChild variant="outline" className="rounded-full">
                                        <Link href={toUrl(edit({ rank: rank.id }))}>Edit</Link>
                                    </Button>
                                    <Button variant="destructive" className="rounded-full" asChild>
                                        <Link href={toUrl(destroy({ rank: rank.id }))} method="delete" as="button">
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

RoleRanksIndex.layout = (page: React.ReactNode) => page;


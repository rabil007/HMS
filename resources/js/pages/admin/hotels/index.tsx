import { Head, Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import PageLayout from '@/layouts/page-layout';
import { toUrl } from '@/lib/utils';
import { dashboard } from '@/routes';
import { create, destroy, edit } from '@/routes/admin/hotels';

export default function HotelsIndex({ hotels }: { hotels: { id: number; name: string }[] }) {
    return (
        <PageLayout title="Hotels" backHref={toUrl(dashboard())}>
            <Head title="Hotels" />

            <div className="flex items-center justify-between gap-4 mb-8">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Hotels</h2>
                    <p className="text-muted-foreground mt-2">Manage hotels on the platform.</p>
                </div>

                <Button asChild className="rounded-full">
                    <Link href={toUrl(create())}>New Hotel</Link>
                </Button>
            </div>

            <div className="rounded-2xl border border-border/80 bg-card/60 backdrop-blur-xl overflow-hidden">
                <div className="divide-y divide-border/60">
                    {hotels.length === 0 ? (
                        <div className="p-6 text-muted-foreground">No hotels yet.</div>
                    ) : (
                        hotels.map((hotel) => (
                            <div key={hotel.id} className="p-6 flex items-center justify-between gap-4">
                                <div className="font-medium">{hotel.name}</div>
                                <div className="flex items-center gap-2">
                                    <Button asChild variant="outline" className="rounded-full">
                                        <Link href={toUrl(edit({ hotel: hotel.id }))}>Edit</Link>
                                    </Button>
                                    <Button variant="destructive" className="rounded-full" asChild>
                                        <Link href={toUrl(destroy({ hotel: hotel.id }))} method="delete" as="button">
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

HotelsIndex.layout = (page: React.ReactNode) => page;


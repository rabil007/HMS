import { Head, Link } from '@inertiajs/react';
import { Building2, Anchor, UserRoundCog } from 'lucide-react';
import PageLayout from '@/layouts/page-layout';
import { toUrl } from '@/lib/utils';
import { dashboard } from '@/routes';
import { index as clientsIndex } from '@/routes/admin/clients';
import { index as ranksIndex } from '@/routes/admin/ranks';
import { index as vesselsIndex } from '@/routes/admin/vessels';

const cards = [
    { name: 'Clients', description: 'Manage client companies', href: clientsIndex(), icon: UserRoundCog },
    { name: 'Ranks', description: 'Manage rank list', href: ranksIndex(), icon: Building2 },
    { name: 'Vessels', description: 'Manage vessel list', href: vesselsIndex(), icon: Anchor },
];

export default function AdminIndex() {
    return (
        <PageLayout title="Admin" backHref={toUrl(dashboard())}>
            <Head title="Admin" />

            <div className="mb-8">
                <h2 className="text-3xl font-bold tracking-tight">Admin</h2>
                <p className="text-muted-foreground mt-2">Admin reference data used across the system.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {cards.map((card) => (
                    <Link
                        key={card.name}
                        href={toUrl(card.href)}
                        className="rounded-2xl border border-border/80 bg-card/60 backdrop-blur-xl p-6 hover:border-primary/40 hover:shadow-lg transition"
                    >
                        <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                                <card.icon className="size-6 text-primary" />
                            </div>
                            <div>
                                <div className="font-semibold">{card.name}</div>
                                <div className="text-sm text-muted-foreground">{card.description}</div>
                            </div>
                        </div>
                    </Link>
                ))}
            </div>
        </PageLayout>
    );
}

AdminIndex.layout = (page: React.ReactNode) => page;


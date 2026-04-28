import { Head, Link, router } from '@inertiajs/react';
import { Hash, Pencil, Trash2, Globe } from 'lucide-react';
import React from 'react';
import { ActivityLog } from '@/components/details/activity-log';
import { DetailHero } from '@/components/details/detail-hero';
import { DetailItem } from '@/components/details/detail-item';
import { useConfirmDialog } from '@/hooks/use-confirm-dialog';
import PageLayout from '@/layouts/page-layout';
import { toUrl } from '@/lib/utils';
import { destroy, edit, index as countriesIndex } from '@/routes/admin/countries';

export default function CountriesShow({ country, activities }: { country: any; activities?: any[] }) {
    const { requestConfirm, ConfirmDialog } = useConfirmDialog();
    const createdAt = country.created_at ? new Date(country.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : null;

    return (
        <PageLayout title="Country Detail" backHref={toUrl(countriesIndex())}>
            <ConfirmDialog />
            <Head title={`Country — ${country.name}`} />

            <div>
                <div className="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-8">
                    <div className="space-y-8">
                        <DetailHero
                            icon={Globe}
                            title={country.name}
                            badges={(
                                <span className="flex items-center gap-1.5 font-mono text-[12px] font-medium text-muted-foreground/80 bg-muted/50 px-2.5 py-1 rounded-md border border-border/50">
                                    <Hash className="size-3" />
                                    {String(country.id)}
                                </span>
                            )}
                            actions={(
                                <>
                                    <Link
                                        href={toUrl(edit({ country: country.id }))}
                                        className="inline-flex items-center justify-center gap-2 h-11 rounded-xl border border-border/60 bg-background/50 hover:bg-muted px-5 text-[14px] font-medium text-foreground transition-all shadow-sm hover:shadow"
                                    >
                                        <Pencil className="size-4" />
                                        Edit
                                    </Link>
                                    <button
                                        type="button"
                                        onClick={async () => {
                                            if (
                                                !(await requestConfirm({
                                                    title: 'Delete this country?',
                                                    description: 'This cannot be undone.',
                                                    confirmText: 'Delete',
                                                    variant: 'destructive',
                                                }))
                                            ) {
                                                return;
                                            }

                                            router.delete(toUrl(destroy({ country: country.id })));
                                        }}
                                        className="inline-flex items-center justify-center gap-2 h-11 rounded-xl border border-destructive/30 bg-destructive/10 hover:bg-destructive/20 px-5 text-[14px] font-medium text-destructive transition-all shadow-sm hover:shadow"
                                    >
                                        <Trash2 className="size-4" />
                                        Delete
                                    </button>
                                </>
                            )}
                        />

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-4">
                                <h3 className="text-[13px] font-bold text-foreground uppercase tracking-widest flex items-center gap-2">
                                    <Globe className="size-4 text-primary" /> Details
                                </h3>
                                <div className="grid gap-3">
                                    <DetailItem icon={Globe} label="Name" value={country.name} />
                                    <DetailItem icon={Hash} label="ISO2" value={String(country.iso2).toUpperCase()} />
                                    <DetailItem icon={Hash} label="Dial code" value={country.dial_code} />
                                    <DetailItem icon={Globe} label="Created" value={createdAt} />
                                </div>
                            </div>
                        </div>
                    </div>

                    <ActivityLog activities={activities} />
                </div>
            </div>
        </PageLayout>
    );
}

CountriesShow.layout = (page: React.ReactNode) => page;


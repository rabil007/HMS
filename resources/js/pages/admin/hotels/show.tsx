import { Head, Link, router } from '@inertiajs/react';
import { Building2, Hash, Pencil, Trash2, Users } from 'lucide-react';
import React from 'react';
import { ActivityLog } from '@/components/details/activity-log';
import { DetailHero } from '@/components/details/detail-hero';
import { DetailItem } from '@/components/details/detail-item';
import { useConfirmDialog } from '@/hooks/use-confirm-dialog';
import PageLayout from '@/layouts/page-layout';
import { toUrl } from '@/lib/utils';
import { destroy, edit, index as hotelsIndex } from '@/routes/admin/hotels';

export default function HotelsShow({ hotel, activities }: { hotel: any; activities?: any[] }) {
    const { requestConfirm, ConfirmDialog } = useConfirmDialog();
    const createdAt = hotel.created_at ? new Date(hotel.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : null;

    return (
        <PageLayout title="Hotel Detail" backHref={toUrl(hotelsIndex())}>
            <ConfirmDialog />
            <Head title={`Hotel — ${hotel.name}`} />

            <div className="max-w-[1200px] mx-auto">
                <div className="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-8">
                    <div className="space-y-8">
                        <DetailHero
                            icon={Building2}
                            title={hotel.name}
                            badges={(
                                <span className="flex items-center gap-1.5 font-mono text-[12px] font-medium text-muted-foreground/80 bg-muted/50 px-2.5 py-1 rounded-md border border-border/50">
                                    <Hash className="size-3" />
                                    {String(hotel.id)}
                                </span>
                            )}
                            actions={(
                                <>
                                    <Link
                                        href={toUrl(edit({ hotel: hotel.id }))}
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
                                                    title: 'Delete this hotel?',
                                                    description: 'This cannot be undone.',
                                                    confirmText: 'Delete',
                                                    variant: 'destructive',
                                                }))
                                            ) {
                                                return;
                                            }

                                            router.delete(toUrl(destroy({ hotel: hotel.id })));
                                        }}
                                        className="inline-flex items-center justify-center gap-2 h-11 rounded-xl border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 px-5 text-[14px] font-medium text-rose-500 transition-all shadow-sm hover:shadow"
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
                                    <Building2 className="size-4 text-primary" /> Details
                                </h3>
                                <div className="grid gap-3">
                                    <DetailItem icon={Building2} label="Name" value={hotel.name} />
                                    <DetailItem icon={Hash} label="Hotel ID" value={hotel.id} />
                                    <DetailItem icon={Users} label="Assigned Users" value={hotel.users_count ?? null} />
                                    <DetailItem icon={Building2} label="Bookings" value={hotel.bookings_count ?? null} />
                                    <DetailItem icon={Building2} label="Created" value={createdAt} />
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

HotelsShow.layout = (page: React.ReactNode) => page;


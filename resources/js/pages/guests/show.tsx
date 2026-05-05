import { Head, Link, router } from '@inertiajs/react';
import { Hash, Mail, Pencil, Phone, Trash2, User, Users } from 'lucide-react';
import React from 'react';
import { ActivityLog } from '@/components/details/activity-log';
import { DetailHero } from '@/components/details/detail-hero';
import { DetailItem } from '@/components/details/detail-item';
import { useConfirmDialog } from '@/hooks/use-confirm-dialog';
import PageLayout from '@/layouts/page-layout';
import { toUrl } from '@/lib/utils';
import { destroy, edit, index as guestsIndex } from '@/routes/guests';

export default function GuestsShow({
    guest,
    activities,
    activityLookups,
}: {
    guest: any;
    activities?: any[];
    activityLookups?: { users?: Record<string, string> };
}) {
    const { requestConfirm, ConfirmDialog } = useConfirmDialog();
    const createdAt = guest.created_at
        ? new Date(guest.created_at).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
          })
        : null;

    return (
        <PageLayout title="Guest Detail" backHref={toUrl(guestsIndex())}>
            <ConfirmDialog />
            <Head title={`Guest — ${guest.full_name}`} />

            <div className="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-8">
                <div className="space-y-8">
                    <DetailHero
                        icon={User}
                        title={guest.full_name}
                        badges={(
                            <span className="flex items-center gap-1.5 font-mono text-[12px] font-medium text-muted-foreground/80 bg-muted/50 px-2.5 py-1 rounded-md border border-border/50">
                                <Hash className="size-3" />
                                {String(guest.id)}
                            </span>
                        )}
                        actions={(
                            <>
                                <Link
                                    href={toUrl(edit({ guest: guest.id }))}
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
                                                title: 'Delete this guest?',
                                                description: guest.bookings_count > 0
                                                    ? 'This guest is referenced by bookings and cannot be deleted.'
                                                    : 'This cannot be undone.',
                                                confirmText: 'Delete',
                                                variant: 'destructive',
                                            }))
                                        ) {
                                            return;
                                        }

                                        router.delete(toUrl(destroy({ guest: guest.id })));
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
                                <User className="size-4 text-primary" /> Details
                            </h3>
                            <div className="grid gap-3">
                                <DetailItem icon={User} label="Full Name" value={guest.full_name} />
                                <DetailItem icon={Mail} label="Email" value={guest.email} />
                                <DetailItem icon={Phone} label="Phone" value={guest.phone} />
                                <DetailItem icon={Users} label="Bookings" value={guest.bookings_count ?? null} />
                                <DetailItem icon={User} label="Created By" value={guest.creator?.name ?? null} />
                                <DetailItem icon={User} label="Created" value={createdAt} />
                            </div>
                        </div>
                    </div>
                </div>

                <ActivityLog activities={activities} lookups={activityLookups} />
            </div>
        </PageLayout>
    );
}

GuestsShow.layout = (page: React.ReactNode) => page;

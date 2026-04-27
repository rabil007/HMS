import { Head, Link, router } from '@inertiajs/react';
import { Building2, Hash, Mail, Pencil, ShieldCheck, Trash2, User, Users } from 'lucide-react';
import React from 'react';
import { ActivityLog } from '@/components/details/activity-log';
import { DetailHero } from '@/components/details/detail-hero';
import { DetailItem } from '@/components/details/detail-item';
import { useConfirmDialog } from '@/hooks/use-confirm-dialog';
import PageLayout from '@/layouts/page-layout';
import { toUrl } from '@/lib/utils';
import { destroy, edit, index as usersIndex } from '@/routes/admin/users';

export default function UsersShow({ user, activities }: { user: any; activities?: any[] }) {
    const { requestConfirm, ConfirmDialog } = useConfirmDialog();
    const createdAt = user.created_at ? new Date(user.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : null;

    return (
        <PageLayout title="User Detail" backHref={toUrl(usersIndex())}>
            <ConfirmDialog />
            <Head title={`User — ${user.name}`} />

            <div className="max-w-[1200px] mx-auto">
                <div className="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-8">
                    <div className="space-y-8">
                        <DetailHero
                            icon={User}
                            title={user.name}
                            subtitle={(
                                <span className="flex items-center gap-1.5 text-[12px] font-medium text-muted-foreground/80 bg-muted/50 px-2.5 py-1 rounded-md border border-border/50">
                                    <Mail className="size-3" />
                                    {user.email}
                                </span>
                            )}
                            badges={(
                                <>
                                    <span className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[12px] font-semibold shadow-sm bg-primary/10 border-primary/20 text-primary">
                                        <ShieldCheck className="size-4" />
                                        {String(user.role).toUpperCase()}
                                    </span>
                                    <span className="flex items-center gap-1.5 font-mono text-[12px] font-medium text-muted-foreground/80 bg-muted/50 px-2.5 py-1 rounded-md border border-border/50">
                                        <Hash className="size-3" />
                                        {String(user.id)}
                                    </span>
                                </>
                            )}
                            actions={(
                                <>
                                    <Link
                                        href={toUrl(edit({ user: user.id }))}
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
                                                    title: 'Delete this user?',
                                                    description: 'This cannot be undone.',
                                                    confirmText: 'Delete',
                                                    variant: 'destructive',
                                                }))
                                            ) {
                                                return;
                                            }

                                            router.delete(toUrl(destroy({ user: user.id })));
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
                                    <User className="size-4 text-primary" /> Profile
                                </h3>
                                <div className="grid gap-3">
                                    <DetailItem icon={User} label="Name" value={user.name} />
                                    <DetailItem icon={Mail} label="Email" value={user.email} />
                                    <DetailItem icon={ShieldCheck} label="Role" value={user.role} />
                                    <DetailItem icon={Hash} label="User ID" value={user.id} />
                                    <DetailItem icon={User} label="Created" value={createdAt} />
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h3 className="text-[13px] font-bold text-foreground uppercase tracking-widest flex items-center gap-2">
                                    <Users className="size-4 text-primary" /> Assignment
                                </h3>
                                <div className="grid gap-3">
                                    <DetailItem icon={Building2} label="Hotel" value={user.hotel?.name ?? null} />
                                    <DetailItem icon={Users} label="Client" value={user.client?.name ?? null} />
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

UsersShow.layout = (page: React.ReactNode) => page;


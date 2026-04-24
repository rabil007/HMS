import React from 'react';

export function DetailHero({
    icon: Icon,
    title,
    subtitle,
    badges,
    actions,
}: {
    icon: React.ElementType;
    title: React.ReactNode;
    subtitle?: React.ReactNode;
    badges?: React.ReactNode;
    actions?: React.ReactNode;
}) {
    return (
        <div className="relative overflow-hidden rounded-4xl border border-border/50 bg-card/60 backdrop-blur-xl p-8 shadow-lg">
            <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-5">
                    <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-linear-to-br from-primary/20 to-primary/5 border border-primary/20 shadow-inner">
                        <Icon className="size-8 text-primary" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-foreground tracking-tight">{title}</h2>
                        {(subtitle || badges) && (
                            <div className="flex flex-wrap items-center gap-3 mt-2">
                                {subtitle}
                                {badges}
                            </div>
                        )}
                    </div>
                </div>

                {actions && <div className="flex items-center gap-3">{actions}</div>}
            </div>
        </div>
    );
}


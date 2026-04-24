import React from 'react';

export function DetailItem({
    icon: Icon,
    label,
    value,
}: {
    icon: React.ElementType;
    label: string;
    value?: string | number | null;
}) {
    if (value === null || value === undefined || value === '') {
        return null;
    }

    return (
        <div className="flex flex-col gap-1.5 p-4 rounded-xl bg-muted/30 border border-border/40">
            <div className="flex items-center gap-2 text-muted-foreground">
                <Icon className="size-3.5" />
                <span className="text-[11px] font-semibold uppercase tracking-widest">{label}</span>
            </div>
            <div className="text-[14px] font-medium text-foreground ml-5.5">{String(value)}</div>
        </div>
    );
}


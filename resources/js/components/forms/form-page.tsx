import React from 'react';

export function formInputClassName() {
    return 'h-12 w-full rounded-xl border-border/60 bg-muted/40 text-[14px] px-4 focus:border-primary/60 focus:ring-2 focus:ring-primary/20 transition-all [color-scheme:light] dark:[color-scheme:dark]';
}

export function formLabelClassName() {
    return 'text-[13px] font-semibold text-foreground mb-2 block';
}

export function FormPageHeader({
    title,
    description,
}: {
    title: string;
    description?: string;
}) {
    return (
        <div className="mb-10">
            <h2 className="text-2xl font-bold text-foreground tracking-tight">{title}</h2>
            {description && (
                <p className="text-[14px] text-muted-foreground mt-1.5">{description}</p>
            )}
        </div>
    );
}

export function FormActions({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="pt-2 border-t border-border/40 flex justify-end">
            {children}
        </div>
    );
}


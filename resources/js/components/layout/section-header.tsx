import React from 'react';
import { cn } from '@/lib/utils';

export type SectionHeaderProps = {
    title: string;
    subtitle?: string;
    icon?: React.ElementType;
    iconClassName?: string;
    iconWrapperClassName?: string;
    right?: React.ReactNode;
    className?: string;
};

export function SectionHeader({
    title,
    subtitle,
    icon: Icon,
    iconClassName,
    iconWrapperClassName,
    right,
    className,
}: SectionHeaderProps) {
    return (
        <div className={cn('flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between', className)}>
            <div className="flex items-center gap-3">
                {Icon && (
                    <div
                        className={cn(
                            'flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10',
                            iconWrapperClassName,
                        )}
                    >
                        <Icon className={cn('size-6 text-primary', iconClassName)} />
                    </div>
                )}

                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-foreground">{title}</h2>
                    {subtitle && <p className="text-muted-foreground text-sm">{subtitle}</p>}
                </div>
            </div>

            {right && <div className="w-full shrink-0 sm:w-auto sm:self-center">{right}</div>}
        </div>
    );
}


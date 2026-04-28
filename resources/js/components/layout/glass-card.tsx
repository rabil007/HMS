import React from 'react';
import { cn } from '@/lib/utils';

export type GlassCardProps = {
    children: React.ReactNode;
    className?: string;
    level?: 'card' | 'inner';
};

export function GlassCard({ children, className, level = 'card' }: GlassCardProps) {
    return (
        <div
            className={cn(
                level === 'inner'
                    ? 'rounded-3xl border border-border/40 bg-background/40 backdrop-blur-md shadow-sm'
                    : 'rounded-3xl border border-border/50 bg-card/40 backdrop-blur-xl shadow-lg',
                className,
            )}
        >
            {children}
        </div>
    );
}


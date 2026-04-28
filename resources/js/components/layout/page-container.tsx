import React from 'react';
import { cn } from '@/lib/utils';

export type PageContainerProps = {
    children: React.ReactNode;
    variant?: 'default' | 'narrow' | 'wide';
    className?: string;
};

export function PageContainer({ children, variant = 'default', className }: PageContainerProps) {
    return (
        <div
            className={cn(
                'mx-auto w-full px-6 md:px-10',
                variant === 'narrow' && 'max-w-4xl',
                variant === 'wide' && 'max-w-7xl',
                variant === 'default' && 'max-w-6xl',
                className,
            )}
        >
            {children}
        </div>
    );
}


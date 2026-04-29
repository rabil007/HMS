import React from 'react';
import { Input } from '@/components/ui/input';

export type ListSearchProps = {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
};

export function ListSearch({ value, onChange, placeholder, className }: ListSearchProps) {
    return (
        <Input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className={[
                'rounded-xl border-border/60 bg-muted/40 text-[14px] px-4 focus:border-primary/60 focus:ring-2 focus:ring-primary/20 transition-all',
                className ?? '',
            ].join(' ')}
        />
    );
}


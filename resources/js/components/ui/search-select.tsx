import { Check, ChevronsUpDown, Search } from 'lucide-react';
import React, { useRef, useState } from 'react';
import { Separator } from '@/components/ui/separator';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';

export type SearchSelectOption = { id: number | string; name: string };

export type SearchSelectProps = {
    options: SearchSelectOption[];
    value: string;
    onChange: (val: string) => void;
    onCreate?: (name: string) => Promise<void>;
    onCreateIntent?: (name: string) => void;
    createLabel?: string;
    placeholder: string;
    error?: string;
    className?: string;
    dropdownClassName?: string;
};

export function SearchSelect({
    options,
    value,
    onChange,
    onCreate,
    onCreateIntent,
    createLabel,
    placeholder,
    error,
    className,
    dropdownClassName,
}: SearchSelectProps) {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [creating, setCreating] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    const filtered = options.filter((o) =>
        o.name.toLowerCase().includes(query.toLowerCase()),
    );
    const normalizedQuery = query.trim().toLowerCase();
    const hasExactMatch =
        normalizedQuery !== '' &&
        options.some((o) => o.name.trim().toLowerCase() === normalizedQuery);
    const selected = options.find((o) => o.id.toString() === value);

    React.useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setOpen(false);
                setQuery('');
            }
        };
        document.addEventListener('mousedown', handler);

        return () => document.removeEventListener('mousedown', handler);
    }, []);

    return (
        <div ref={ref} className="relative w-full">
            <button
                type="button"
                onClick={() => setOpen((o) => !o)}
                className={cn(
                    'flex h-11 w-full items-center justify-between rounded-lg border bg-background px-3.5 text-sm shadow-sm transition-all',
                    open
                        ? 'border-primary/60 ring-2 ring-primary/20'
                        : 'border-input hover:border-border/80',
                    error && 'border-destructive ring-2 ring-destructive/20',
                    className,
                )}
            >
                <span
                    className={cn(
                        'truncate',
                        selected ? 'text-foreground' : 'text-muted-foreground',
                    )}
                >
                    {selected ? selected.name : placeholder}
                </span>
                <ChevronsUpDown className="size-4 shrink-0 text-muted-foreground/60" />
            </button>

            {open && (
                <div
                    className={cn(
                        'absolute z-50 mt-2 w-full overflow-hidden rounded-lg border border-border bg-popover shadow-lg',
                        dropdownClassName,
                    )}
                >
                    <div className="flex items-center gap-2 border-b border-border/50 bg-muted/30 px-3 py-2">
                        <Search className="size-4 shrink-0 text-muted-foreground" />
                        <input
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Search..."
                            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
                            autoFocus
                        />
                    </div>

                    <div className="max-h-64 overflow-y-auto py-1">
                        {filtered.length > 0 ? (
                            filtered.map((opt) => (
                                <button
                                    key={opt.id}
                                    type="button"
                                    onClick={() => {
                                        onChange(opt.id.toString());
                                        setOpen(false);
                                        setQuery('');
                                    }}
                                    className="flex w-full items-center justify-between px-3 py-2 text-left text-sm transition-colors hover:bg-accent"
                                >
                                    <span className="truncate text-foreground">
                                        {opt.name}
                                    </span>
                                    {opt.id.toString() === value && (
                                        <Check className="size-4 shrink-0 text-primary" />
                                    )}
                                </button>
                            ))
                        ) : (
                            <div className="px-3 py-6 text-center text-sm text-muted-foreground">
                                No results found
                            </div>
                        )}
                    </div>

                    {(onCreate || onCreateIntent) &&
                        query.trim() !== '' &&
                        !hasExactMatch && (
                            <>
                                <Separator />
                                <div className="p-2">
                                    <button
                                        type="button"
                                        disabled={creating}
                                        onClick={async () => {
                                            if (onCreateIntent) {
                                                onCreateIntent(query.trim());
                                                setOpen(false);
                                                setQuery('');

                                                return;
                                            }

                                            if (onCreate) {
                                                setCreating(true);

                                                try {
                                                    await onCreate(query.trim());
                                                    setOpen(false);
                                                    setQuery('');
                                                } finally {
                                                    setCreating(false);
                                                }
                                            }
                                        }}
                                        className="flex w-full items-center gap-2 rounded-md bg-primary/10 px-3 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary/15 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        {creating ? (
                                            <Spinner className="size-4" />
                                        ) : (
                                            <span className="text-base font-semibold leading-none">
                                                +
                                            </span>
                                        )}
                                        <span className="truncate">
                                            {createLabel ?? 'Create'}: "
                                            {query.trim()}"
                                        </span>
                                    </button>
                                </div>
                            </>
                        )}
                </div>
            )}
        </div>
    );
}

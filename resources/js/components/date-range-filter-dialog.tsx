import React from 'react';
import { DayPicker } from 'react-day-picker';
import type { DateRange } from 'react-day-picker';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

function toISODate(d: Date) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');

    return `${y}-${m}-${day}`;
}

function parseISODateOnly(s: string): Date | undefined {
    const slice = s.slice(0, 10);
    const m = slice.match(/^(\d{4})-(\d{2})-(\d{2})$/);

    if (!m) {
        return undefined;
    }

    return new Date(`${slice}T00:00:00`);
}

export type DateRangeFilterDialogProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    from: string;
    to: string;
    onApply: (from: string, to: string) => void;
    onClear: () => void;
    title?: string;
    description?: string;
    pickerStartYear?: number;
    pickerEndYear?: number;
};

export function DateRangeFilterDialog({
    open,
    onOpenChange,
    from,
    to,
    onApply,
    onClear,
    title = 'Date filter',
    description = 'Pick a date range.',
    pickerStartYear = 2020,
    pickerEndYear,
}: DateRangeFilterDialogProps) {
    const [pendingRange, setPendingRange] = React.useState<DateRange | undefined>(undefined);

    const endYear = pickerEndYear ?? new Date().getFullYear() + 5;

    const selectedRange = React.useMemo(() => {
        const fromDate = from ? parseISODateOnly(from) : undefined;
        const toDate = to ? parseISODateOnly(to) : undefined;

        return { from: fromDate, to: toDate };
    }, [from, to]);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription>{description}</DialogDescription>
                </DialogHeader>

                <div className="flex flex-col gap-3">
                    <div className="rounded-xl border border-border/60 bg-background/60 p-2">
                        <DayPicker
                            mode="range"
                            numberOfMonths={1}
                            selected={pendingRange ?? selectedRange}
                            onSelect={(range) => setPendingRange(range ?? undefined)}
                            showOutsideDays
                            captionLayout="dropdown"
                            startMonth={new Date(pickerStartYear, 0)}
                            endMonth={new Date(endYear, 11)}
                            className="rdp"
                        />
                    </div>

                    <div className="flex flex-wrap gap-2 text-xs font-semibold text-muted-foreground">
                        <span className="rounded-lg border border-border/60 bg-muted/20 px-2.5 py-1">
                            From: {(pendingRange?.from ?? selectedRange.from) ? toISODate((pendingRange?.from ?? selectedRange.from) as Date) : '—'}
                        </span>
                        <span className="rounded-lg border border-border/60 bg-muted/20 px-2.5 py-1">
                            To: {(pendingRange?.to ?? selectedRange.to) ? toISODate((pendingRange?.to ?? selectedRange.to) as Date) : '—'}
                        </span>
                    </div>
                </div>

                <DialogFooter>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                            setPendingRange(undefined);
                            onClear();
                        }}
                        className="rounded-xl"
                    >
                        Clear
                    </Button>
                    <Button
                        type="button"
                        onClick={() => {
                            const fromDate = pendingRange?.from ?? selectedRange.from;
                            const toDate = pendingRange?.to ?? selectedRange.to;

                            onApply(fromDate ? toISODate(fromDate) : '', toDate ? toISODate(toDate) : '');
                            setPendingRange(undefined);
                            onOpenChange(false);
                        }}
                        className="rounded-xl"
                    >
                        Apply
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

import * as React from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

export type ConfirmOptions = {
    title: string;
    description?: string;
    confirmText?: string;
    cancelText?: string;
    variant?: 'default' | 'destructive';
};

export function useConfirmDialog() {
    const [open, setOpen] = React.useState(false);
    const [options, setOptions] = React.useState<ConfirmOptions | null>(null);
    const pendingRef = React.useRef<{ resolve: (v: boolean) => void } | null>(null);

    const finish = React.useCallback((result: boolean) => {
        const p = pendingRef.current;
        if (!p) {
            return;
        }
        pendingRef.current = null;
        p.resolve(result);
        setOpen(false);
        setOptions(null);
    }, []);

    const requestConfirm = React.useCallback((opts: ConfirmOptions) => {
        return new Promise<boolean>((resolve) => {
            pendingRef.current = { resolve };
            setOptions(opts);
            setOpen(true);
        });
    }, []);

    const ConfirmDialog = () => (
        <Dialog
            open={open}
            onOpenChange={(next) => {
                if (!next) {
                    finish(false);
                }
            }}
        >
            {options && (
                <DialogContent hideClose className="rounded-2xl sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>{options.title}</DialogTitle>
                        {options.description ? (
                            <DialogDescription>{options.description}</DialogDescription>
                        ) : null}
                    </DialogHeader>
                    <DialogFooter className="gap-2 sm:gap-2">
                        <Button type="button" variant="outline" className="rounded-xl" onClick={() => finish(false)}>
                            {options.cancelText ?? 'Cancel'}
                        </Button>
                        <Button
                            type="button"
                            variant={options.variant === 'destructive' ? 'destructive' : 'default'}
                            className="rounded-xl"
                            onClick={() => finish(true)}
                        >
                            {options.confirmText ?? 'Confirm'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            )}
        </Dialog>
    );

    return { requestConfirm, ConfirmDialog };
}

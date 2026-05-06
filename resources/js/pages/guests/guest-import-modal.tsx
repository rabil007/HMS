import { ExcelImportModal } from '@/components/excel-import-modal';
import { toUrl } from '@/lib/utils';
import { importMethod as importGuests, importPreview, importTemplate } from '@/routes/guests';

interface GuestImportModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function GuestImportModal({ open, onOpenChange }: GuestImportModalProps) {
    return (
        <ExcelImportModal
            open={open}
            onOpenChange={onOpenChange}
            entityLabel="Guests"
            previewUrl={toUrl(importPreview())}
            importUrl={toUrl(importGuests())}
            templateUrl={toUrl(importTemplate())}
        />
    );
}

<?php

namespace App\Imports;

use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\ToCollection;
use Maatwebsite\Excel\Concerns\WithHeadingRow;

/**
 * Lightweight wrapper used only with `Excel::toCollection` so the heading
 * row is consumed and rows arrive keyed by snake_case column names. The
 * real parsing happens in {@see BookingImportParser}.
 */
class BookingsImport implements ToCollection, WithHeadingRow
{
    /**
     * @param  Collection<int,array<string,mixed>>  $collection
     */
    public function collection(Collection $collection): void
    {
        // No-op. We only use this class with Excel::toCollection().
    }
}

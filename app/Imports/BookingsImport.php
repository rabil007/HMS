<?php

namespace App\Imports;

use App\Services\BookingImportParser;
use Maatwebsite\Excel\Concerns\ToArray;
use Maatwebsite\Excel\Concerns\WithHeadingRow;

/**
 * Lightweight wrapper used only with `Excel::toCollection` so the heading
 * row is consumed and rows arrive keyed by snake_case column names. The
 * real parsing happens in {@see BookingImportParser}.
 */
class BookingsImport implements ToArray, WithHeadingRow
{
    /**
     * @param  array<int,array<string,mixed>>  $array
     */
    public function array(array $array): void
    {
        // No-op. We only use this class with Excel::toCollection().
    }
}

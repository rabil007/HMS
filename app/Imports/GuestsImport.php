<?php

namespace App\Imports;

use App\Models\Guest;
use Maatwebsite\Excel\Concerns\SkipsEmptyRows;
use Maatwebsite\Excel\Concerns\ToModel;
use Maatwebsite\Excel\Concerns\WithHeadingRow;

class GuestsImport implements SkipsEmptyRows, ToModel, WithHeadingRow
{
    public function model(array $row)
    {
        if (empty($row['name'])) {
            return null;
        }

        $name = trim((string) $row['name']);
        $name = str_replace("\xC2\xA0", ' ', $name);
        $name = (string) preg_replace('/\s+/', ' ', $name);

        if ($name === '') {
            return null;
        }

        return Guest::firstOrCreate(['full_name' => $name]);
    }
}

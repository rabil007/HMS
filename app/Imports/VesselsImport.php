<?php

namespace App\Imports;

use App\Models\Vessel;
use Maatwebsite\Excel\Concerns\SkipsEmptyRows;
use Maatwebsite\Excel\Concerns\ToModel;
use Maatwebsite\Excel\Concerns\WithHeadingRow;

class VesselsImport implements SkipsEmptyRows, ToModel, WithHeadingRow
{
    public function model(array $row)
    {
        if (empty($row['name'])) {
            return null;
        }

        // Sanitize: trim, replace non-breaking spaces with normal spaces, and replace multiple spaces with a single space
        $name = trim($row['name']);
        $name = str_replace("\xC2\xA0", ' ', $name); // Replace unicode non-breaking space
        $name = preg_replace('/\s+/', ' ', $name);

        if (empty($name)) {
            return null;
        }

        // Only create if it doesn't exist
        return Vessel::firstOrCreate([
            'name' => $name,
        ]);
    }
}

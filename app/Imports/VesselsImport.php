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

        // Only create if it doesn't exist
        return Vessel::firstOrCreate([
            'name' => trim($row['name']),
        ]);
    }
}

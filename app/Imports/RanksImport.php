<?php

namespace App\Imports;

use App\Models\Rank;
use Maatwebsite\Excel\Concerns\SkipsEmptyRows;
use Maatwebsite\Excel\Concerns\ToModel;
use Maatwebsite\Excel\Concerns\WithHeadingRow;

class RanksImport implements SkipsEmptyRows, ToModel, WithHeadingRow
{
    public function model(array $row)
    {
        if (empty($row['name'])) {
            return null;
        }

        $name = trim($row['name']);
        $name = str_replace("\xC2\xA0", ' ', $name);
        $name = preg_replace('/\s+/', ' ', $name);

        if (empty($name)) {
            return null;
        }

        return Rank::firstOrCreate(['name' => $name]);
    }
}

<?php

namespace App\Exports;

use Maatwebsite\Excel\Concerns\FromArray;
use Maatwebsite\Excel\Concerns\WithHeadings;

class RankTemplateExport implements FromArray, WithHeadings
{
    public function array(): array
    {
        return [
            ['Captain'],
            ['Chief Officer'],
        ];
    }

    public function headings(): array
    {
        return ['Name'];
    }
}

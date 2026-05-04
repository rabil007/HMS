<?php

namespace App\Exports;

use Maatwebsite\Excel\Concerns\FromArray;
use Maatwebsite\Excel\Concerns\WithHeadings;

class VesselTemplateExport implements FromArray, WithHeadings
{
    public function array(): array
    {
        return [
            ['Sea Explorer'],
            ['Ocean Voyager'],
        ];
    }

    public function headings(): array
    {
        return [
            'Name',
        ];
    }
}

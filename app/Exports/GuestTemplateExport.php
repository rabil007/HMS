<?php

namespace App\Exports;

use Maatwebsite\Excel\Concerns\FromArray;
use Maatwebsite\Excel\Concerns\WithHeadings;

class GuestTemplateExport implements FromArray, WithHeadings
{
    public function array(): array
    {
        return [
            ['John Doe'],
            ['Jane Roe'],
        ];
    }

    public function headings(): array
    {
        return ['Name'];
    }
}

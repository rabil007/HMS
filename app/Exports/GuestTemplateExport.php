<?php

namespace App\Exports;

use Maatwebsite\Excel\Concerns\FromArray;
use Maatwebsite\Excel\Concerns\WithHeadings;

class GuestTemplateExport implements FromArray, WithHeadings
{
    public function array(): array
    {
        return [
            ['John Doe', 'john@example.com', '+971500000001'],
            ['Jane Roe', '', ''],
        ];
    }

    public function headings(): array
    {
        return ['Name', 'Email', 'Phone'];
    }
}

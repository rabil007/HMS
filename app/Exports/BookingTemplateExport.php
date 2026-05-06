<?php

namespace App\Exports;

use Maatwebsite\Excel\Concerns\FromArray;
use Maatwebsite\Excel\Concerns\WithHeadings;

class BookingTemplateExport implements FromArray, WithHeadings
{
    public function array(): array
    {
        return [
            ['JOHN DOE', '+971501234567', 'CO', 'ADNOC 712', '1607', 'SINGLE', '2026-04-12', '', 'OPEN', '', 'Walk-in', '', 'CNF-001', 'CENTRO'],
            ['JANE ROE', '+971507654321', 'AB', 'AL QAFAI', '1208', 'TWIN', '2026-04-15', '', '2026-04-20', '', 'Late arrival', '', 'CNF-002', 'TRIANON'],
        ];
    }

    public function headings(): array
    {
        return [
            'Guest Name',
            'Mobile No',
            'Rank',
            'Vessel',
            'Room no.',
            'Room type',
            'Check-in Date',
            'Check-in Time',
            'Check-out Date',
            'Check-out Time',
            'Remarks',
            'REQUESTS',
            'Booking confirmation',
            'HOTEL',
        ];
    }
}

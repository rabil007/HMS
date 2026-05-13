<?php

namespace App\Exports;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Carbon;
use Maatwebsite\Excel\Concerns\FromQuery;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;

class BookingExport implements FromQuery, WithHeadings, WithMapping
{
    private int $rowNo = 0;

    public function __construct(private Builder $query) {}

    public function query(): Builder
    {
        return $this->query;
    }

    public function headings(): array
    {
        return [
            'No',
            'Reference',
            'Guest Name',
            'Rank',
            'Vessel',
            'Hotel',
            'Room No.',
            'Room Type',
            'Confirmation #',
            'Check-in Date',
            'Check-out Date',
            'Actual Check-in',
            'Actual Check-out',
            'Nights',
            'Status',
        ];
    }

    public function map($row): array
    {
        $this->rowNo++;

        $checkIn = $row->guest_check_in
            ? Carbon::parse($row->guest_check_in)
            : ($row->actual_check_in_date ? Carbon::parse($row->actual_check_in_date) : null);

        $checkOut = $row->guest_check_out
            ? Carbon::parse($row->guest_check_out)
            : ($row->actual_check_out_date ? Carbon::parse($row->actual_check_out_date) : null);

        $nights = ($checkIn && $checkOut)
            ? (int) $checkIn->startOfDay()->diffInDays($checkOut->startOfDay())
            : '';

        return [
            $this->rowNo,
            $row->public_id,
            $row->guest_name,
            $row->rank?->name,
            $row->vessel?->name,
            $row->hotel?->name,
            $row->room_number,
            $row->single_or_twin,
            $row->confirmation_number,
            $row->check_in_date ? Carbon::parse($row->check_in_date)->format('d/m/Y') : '',
            $row->check_out_date ? Carbon::parse($row->check_out_date)->format('d/m/Y') : '',
            $checkIn?->format('d/m/Y H:i') ?? '',
            $checkOut?->format('d/m/Y H:i') ?? '',
            $nights,
            $row->status instanceof \BackedEnum ? $row->status->value : (string) $row->status,
        ];
    }
}

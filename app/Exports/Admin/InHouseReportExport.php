<?php

namespace App\Exports\Admin;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Carbon;
use Maatwebsite\Excel\Concerns\FromQuery;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;

class InHouseReportExport implements FromQuery, WithHeadings, WithMapping
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
            'Guest Name',
            'Rank',
            'Check-in Date',
            'Check-in Time',
            'Nights Stayed',
            'Vessel',
            'Room No.',
            'Single or Twin',
            'Confirmation Number',
            'Hotel',
            'Client',
            'Remarks',
        ];
    }

    public function map($row): array
    {
        $this->rowNo++;

        $checkInAt = $row->guest_check_in ? Carbon::parse($row->guest_check_in) : null;
        $checkInDate = $checkInAt?->format('d/m/Y') ?? '';
        $checkInTime = $checkInAt?->format('h:i:s A') ?? '';

        $nightsStayed = $checkInAt
            ? max(0, (int) $checkInAt->copy()->startOfDay()->diffInDays(now()->startOfDay(), false))
            : '';

        return [
            $this->rowNo,
            $row->guest_name,
            $row->rank?->name,
            $checkInDate,
            $checkInTime,
            $nightsStayed,
            $row->vessel?->name,
            $row->room_number,
            $row->single_or_twin,
            $row->confirmation_number,
            $row->hotel?->name,
            $row->client?->name,
            $row->remarks,
        ];
    }
}

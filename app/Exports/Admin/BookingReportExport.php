<?php

namespace App\Exports\Admin;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Carbon;
use Maatwebsite\Excel\Concerns\FromQuery;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;

class BookingReportExport implements FromQuery, WithHeadings, WithMapping
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
            'Guest name',
            'Rank',
            'Check in Date',
            'Check in Time',
            'Check out Date',
            'Check out Time',
            'Nights until today',
            'No of Nights',
            'Vessel',
            'Room no.',
            'Single or Twin',
            'Confirmation Number',
            'Remarks',
        ];
    }

    public function map($row): array
    {
        $this->rowNo++;

        $checkInAt = $row->guest_check_in ? Carbon::parse($row->guest_check_in) : null;
        $checkOutAt = $row->guest_check_out ? Carbon::parse($row->guest_check_out) : null;

        $checkInDate = $checkInAt?->format('d/m/Y') ?? optional($row->actual_check_in_date)->format('d/m/Y') ?? optional($row->check_in_date)->format('d/m/Y');
        $checkInTime = $checkInAt?->format('h:i:s A') ?? '';

        $checkOutDate = $checkOutAt
            ? $checkOutAt->format('d/m/Y')
            : ($row->actual_check_in_date || $row->check_in_date ? 'OPEN' : '');
        $checkOutTime = $checkOutAt?->format('h:i:s A') ?? '';

        $actualCheckIn = $row->actual_check_in_date ? Carbon::parse($row->actual_check_in_date)->startOfDay() : null;
        $scheduledCheckIn = $row->check_in_date ? Carbon::parse($row->check_in_date)->startOfDay() : null;

        $checkInBase = $checkInAt?->copy()->startOfDay() ?? $actualCheckIn ?? $scheduledCheckIn;
        $checkOutBase = $checkOutAt?->copy()->startOfDay();

        $nightsUntilToday = $checkInBase ? max(0, $checkInBase->diffInDays(now()->startOfDay(), false)) : '';
        $noOfNights = ($checkInBase && $checkOutBase) ? $checkInBase->diffInDays($checkOutBase) : '';

        return [
            $this->rowNo,
            $row->guest_name,
            $row->rank?->name,
            $checkInDate,
            $checkInTime,
            $checkOutDate,
            $checkOutTime,
            $nightsUntilToday,
            $noOfNights,
            $row->vessel?->name,
            '',
            $row->single_or_twin,
            $row->confirmation_number,
            $row->remarks,
        ];
    }
}


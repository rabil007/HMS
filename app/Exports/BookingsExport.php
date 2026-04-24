<?php

namespace App\Exports;

use App\Models\Booking;
use Illuminate\Database\Eloquent\Builder;
use Maatwebsite\Excel\Concerns\FromQuery;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;

class BookingsExport implements FromQuery, WithHeadings, WithMapping
{
    public function __construct(
        protected Builder $query
    ) {}

    public function query()
    {
        return $this->query;
    }

    public function headings(): array
    {
        return [
            'Public ID',
            'Hotel',
            'Status',
            'Check-in',
            'Check-out',
            'Guest name',
            'Guest email',
            'Guest phone',
            'Room type',
            'Created at',
        ];
    }

    public function map($row): array
    {
        /** @var Booking $row */
        return [
            $row->public_id,
            $row->hotel?->name,
            $row->status->value,
            optional($row->check_in_date)->toDateString(),
            optional($row->check_out_date)->toDateString(),
            $row->guest_name,
            $row->guest_email,
            $row->guest_phone,
            $row->single_or_twin,
            optional($row->created_at)->toISOString(),
        ];
    }
}

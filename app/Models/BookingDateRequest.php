<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Spatie\Activitylog\Models\Concerns\LogsActivity;
use Spatie\Activitylog\Support\LogOptions;

class BookingDateRequest extends Model
{
    use HasFactory, LogsActivity, SoftDeletes;

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->useLogName('booking_date_request')
            ->logOnly([
                'booking_id',
                'requested_by_user_id',
                'requested_check_in_date',
                'requested_check_out_date',
                'status',
                'responded_by_user_id',
                'responded_at',
                'response_note',
            ])
            ->logOnlyDirty();
    }
}

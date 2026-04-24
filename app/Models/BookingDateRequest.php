<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;
use Spatie\Activitylog\Models\Concerns\LogsActivity;
use Spatie\Activitylog\Support\LogOptions;

#[Fillable([
    'booking_id',
    'requested_by_user_id',
    'requested_check_in_date',
    'requested_check_out_date',
    'status',
    'responded_by_user_id',
    'responded_at',
    'response_note',
])]
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

    public function booking(): BelongsTo
    {
        return $this->belongsTo(Booking::class);
    }

    public function requestedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'requested_by_user_id');
    }

    public function respondedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'responded_by_user_id');
    }
}

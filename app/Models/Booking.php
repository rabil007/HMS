<?php

namespace App\Models;

use App\Enums\BookingStatus;
use App\Models\Traits\BelongsToHotel;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

#[Fillable([
    'hotel_id',
    'user_id',
    'public_id',
    'status',
    'check_in_date',
    'check_out_date',
    'guest_name',
    'guest_email',
    'guest_phone',
    'client_id',
    'rank_id',
    'vessel_id',
    'single_or_twin',
    'confirmation_number',
    'remarks',
    'approved_at',
    'approved_by_user_id',
    'rejected_at',
    'rejected_by_user_id',
])]
class Booking extends Model
{
    use BelongsToHotel, HasFactory, SoftDeletes;

    protected function casts(): array
    {
        return [
            'check_in_date' => 'date',
            'check_out_date' => 'date',
            'status' => BookingStatus::class,
            'approved_at' => 'datetime',
            'rejected_at' => 'datetime',
        ];
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function hotel()
    {
        return $this->belongsTo(Hotel::class);
    }

    public function client()
    {
        return $this->belongsTo(Client::class);
    }

    public function rank()
    {
        return $this->belongsTo(Rank::class);
    }

    public function vessel()
    {
        return $this->belongsTo(Vessel::class);
    }

    public function approvedBy()
    {
        return $this->belongsTo(User::class, 'approved_by_user_id');
    }

    public function rejectedBy()
    {
        return $this->belongsTo(User::class, 'rejected_by_user_id');
    }
}

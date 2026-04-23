<?php

namespace App\Models;

use App\Enums\BookingStatus;
use App\Models\Traits\BelongsToHotel;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

#[Fillable(['hotel_id', 'user_id', 'room_id', 'public_id', 'status', 'check_in_date', 'check_out_date', 'guest_name', 'guest_email', 'guest_phone'])]
class Booking extends Model
{
    use BelongsToHotel, HasFactory, SoftDeletes;

    protected function casts(): array
    {
        return [
            'check_in_date' => 'date',
            'check_out_date' => 'date',
            'status' => BookingStatus::class,
        ];
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function room()
    {
        return $this->belongsTo(Room::class);
    }
}

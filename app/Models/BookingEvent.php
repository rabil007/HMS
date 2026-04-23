<?php

namespace App\Models;

use Database\Factories\BookingEventFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

#[Fillable(['booking_id', 'actor_user_id', 'event_type'])]
class BookingEvent extends Model
{
    /** @use HasFactory<BookingEventFactory> */
    use HasFactory, SoftDeletes;

    public function booking()
    {
        return $this->belongsTo(Booking::class);
    }

    public function actor()
    {
        return $this->belongsTo(User::class, 'actor_user_id');
    }
}

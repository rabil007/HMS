<?php

namespace App\Models;

use App\Models\Traits\BelongsToHotel;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

#[Fillable(['hotel_id', 'room_number', 'status'])]
class Room extends Model
{
    use BelongsToHotel, HasFactory, SoftDeletes;
}

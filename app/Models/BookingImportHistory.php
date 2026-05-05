<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class BookingImportHistory extends Model
{
    protected $fillable = [
        'user_id',
        'file_name',
        'submitted_count',
        'created_count',
        'failed_count',
        'failed_rows',
    ];

    protected function casts(): array
    {
        return [
            'failed_rows' => 'array',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function bookings(): HasMany
    {
        return $this->hasMany(Booking::class);
    }
}

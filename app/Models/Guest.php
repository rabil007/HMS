<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Spatie\Activitylog\Models\Concerns\LogsActivity;
use Spatie\Activitylog\Support\LogOptions;

class Guest extends Model
{
    use HasFactory, LogsActivity, SoftDeletes;

    protected $fillable = [
        'full_name',
        'email',
        'phone',
        'notes',
        'created_by_user_id',
    ];

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->useLogName('guest')
            ->logOnly(['full_name', 'email', 'phone', 'notes', 'created_by_user_id'])
            ->logOnlyDirty();
    }

    public function activities(): MorphMany
    {
        return $this->activitiesAsSubject();
    }

    public function bookings(): HasMany
    {
        return $this->hasMany(Booking::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by_user_id');
    }
}

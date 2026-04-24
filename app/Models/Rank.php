<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Spatie\Activitylog\Models\Concerns\LogsActivity;
use Spatie\Activitylog\Support\LogOptions;

class Rank extends Model
{
    use HasFactory, LogsActivity, SoftDeletes;

    public function activities(): MorphMany
    {
        return $this->activitiesAsSubject();
    }

    protected $fillable = [
        'name',
    ];

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->useLogName('rank')
            ->logOnly(['name'])
            ->logOnlyDirty();
    }

    public function bookings(): HasMany
    {
        return $this->hasMany(Booking::class);
    }
}

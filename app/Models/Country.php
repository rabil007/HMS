<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\MorphMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Spatie\Activitylog\Models\Concerns\LogsActivity;
use Spatie\Activitylog\Support\LogOptions;

class Country extends Model
{
    use HasFactory, LogsActivity, SoftDeletes;

    public function activities(): MorphMany
    {
        return $this->activitiesAsSubject();
    }

    protected $fillable = [
        'name',
        'iso2',
        'dial_code',
    ];

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->useLogName('country')
            ->logOnly(['name', 'iso2', 'dial_code'])
            ->logOnlyDirty();
    }
}

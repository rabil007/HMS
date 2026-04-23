<?php

namespace App\Models\Traits;

use App\Models\Hotel;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

trait BelongsToHotel
{
    public function hotel(): BelongsTo
    {
        return $this->belongsTo(Hotel::class);
    }

    public function scopeForCurrentHotel(Builder $query): Builder
    {
        $user = auth()->user();
        if ($user && $user->hotel_id) {
            return $query->where($this->getTable().'.hotel_id', $user->hotel_id);
        }

        return $query;
    }
}

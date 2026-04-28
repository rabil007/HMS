<?php

namespace App\Services;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;

class BookingIndexQuery
{
    /**
     * @param  array<int>  $allowed
     */
    public function perPage(Request $request, int $default = 15, array $allowed = [15, 30, 50, 100]): int
    {
        $perPage = $request->integer('per_page') ?: $default;

        return in_array($perPage, $allowed, true) ? $perPage : $default;
    }

    /**
     * @param  array<int, string>  $columns
     */
    public function applyTextSearch(Builder $query, string $q, array $columns, bool $searchClientName = false): Builder
    {
        $q = trim($q);
        if ($q === '') {
            return $query;
        }

        return $query->where(function (Builder $inner) use ($q, $columns, $searchClientName) {
            foreach ($columns as $column) {
                $inner->orWhere($column, 'like', "%{$q}%");
            }

            if ($searchClientName) {
                $inner->orWhereHas('client', fn (Builder $c) => $c->where('name', 'like', "%{$q}%"));
            }
        });
    }
}

<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Database\Eloquent\Collection as EloquentCollection;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Collection;
use Spatie\Activitylog\Models\Activity;

class ActivityLogFormatter
{
    /**
     * Format the activity log for an Eloquent subject for delivery to Inertia pages.
     *
     * @param  array<string, class-string<Model>>  $relatedLookups
     *                                                              Map of foreign-key columns (as found inside activity changes) to the
     *                                                              Eloquent model that should be used to resolve display names. The
     *                                                              resulting `activityLookups` array uses the model's table name as its
     *                                                              key, e.g. `['user_id' => User::class]` produces a `users` lookup.
     * @return array{activities: Collection<int, array<string, mixed>>, activityLookups: array<string, Collection<int, string>>}
     */
    public function format(Model $subject, array $relatedLookups = []): array
    {
        if ($relatedLookups === []) {
            $relatedLookups = ['user_id' => User::class];
        }

        /** @var EloquentCollection<int, Activity> $activitiesRaw */
        $activitiesRaw = $subject->activities()
            ->with('causer')
            ->latest()
            ->get();

        $idsByKey = $this->harvestIds($activitiesRaw, array_keys($relatedLookups));

        $activityLookups = [];
        foreach ($relatedLookups as $idKey => $modelClass) {
            $ids = $idsByKey->get($idKey, collect());

            if ($idKey === 'user_id') {
                $ids = $ids->merge($idsByKey->filter(
                    fn (Collection $_, string $key): bool => str_ends_with($key, '_user_id')
                )->flatten())->unique()->values();
            }

            $instance = new $modelClass;
            $bucketKey = $instance->getTable();

            $activityLookups[$bucketKey] = $modelClass::query()
                ->whereIn($instance->getKeyName(), $ids)
                ->pluck('name', $instance->getKeyName());
        }

        $activities = $activitiesRaw->map(function (Activity $a): array {
            $changes = $this->extractChanges($a);

            return [
                'id' => $a->id,
                'event' => $a->event,
                'description' => $a->description,
                'causer' => $a->causer?->name,
                'changes' => [
                    'old' => $changes['old'] ?? null,
                    'attributes' => $changes['attributes'] ?? null,
                ],
                'created_at' => $a->created_at?->toISOString(),
            ];
        });

        return [
            'activities' => $activities,
            'activityLookups' => $activityLookups,
        ];
    }

    /**
     * Read the `old` / `attributes` payload from an Activity, falling back to
     * the legacy `properties` column for older log rows.
     *
     * @return array{old?: mixed, attributes?: mixed}
     */
    private function extractChanges(Activity $a): array
    {
        $changes = $a->attribute_changes?->toArray() ?? [];

        if (! isset($changes['old']) && ! isset($changes['attributes'])) {
            $changes = [
                'old' => $a->properties['old'] ?? null,
                'attributes' => $a->properties['attributes'] ?? null,
            ];
        }

        return $changes;
    }

    /**
     * Walk every activity's change payload and harvest the numeric IDs found
     * under the requested keys (plus any `*_user_id` siblings, which always
     * fold into `user_id`).
     *
     * @param  EloquentCollection<int, Activity>  $activities
     * @param  array<int, string>  $keys
     * @return Collection<string, Collection<int, int>>
     */
    private function harvestIds(EloquentCollection $activities, array $keys): Collection
    {
        $allowed = array_flip($keys);

        return $activities
            ->flatMap(function (Activity $a) use ($allowed): Collection {
                $changes = $this->extractChanges($a);
                $attrs = is_array($changes['attributes'] ?? null) ? $changes['attributes'] : [];
                $old = is_array($changes['old'] ?? null) ? $changes['old'] : [];

                return collect([$attrs, $old])
                    ->flatMap(fn (array $arr): Collection => collect($arr)
                        ->filter(function ($v, $k) use ($allowed): bool {
                            $key = (string) $k;

                            return isset($allowed[$key]) || str_ends_with($key, '_user_id');
                        })
                        ->mapWithKeys(fn ($v, $k): array => [(string) $k => $v]));
            })
            ->filter(fn ($v): bool => is_numeric($v))
            ->groupBy(fn ($v, $k): string => (string) $k)
            ->map(fn (Collection $values): Collection => $values
                ->map(fn ($v): int => (int) $v)
                ->unique()
                ->values());
    }
}

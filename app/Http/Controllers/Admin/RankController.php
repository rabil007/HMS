<?php

namespace App\Http\Controllers\Admin;

use App\Exports\RankTemplateExport;
use App\Http\Controllers\Controller;
use App\Http\Requests\StoreRankRequest;
use App\Http\Requests\UpdateRankRequest;
use App\Imports\RanksImport;
use App\Models\Rank;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Maatwebsite\Excel\Facades\Excel;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class RankController extends Controller
{
    public function index(Request $request)
    {
        $q = $request->string('q')->trim()->toString();
        $sort = $request->string('sort')->toString();
        $dir = strtolower($request->string('dir')->toString()) === 'asc' ? 'asc' : 'desc';
        $perPage = $request->integer('per_page') ?: 15;
        $perPage = in_array($perPage, [15, 30, 50, 100], true) ? $perPage : 15;

        $allowedSorts = [
            'name' => 'name',
            'created_at' => 'created_at',
        ];
        $sort = array_key_exists($sort, $allowedSorts) ? $sort : 'name';

        $query = Rank::query()
            ->when($q !== '', fn ($query) => $query->where('name', 'like', "%{$q}%"))
            ->orderBy($allowedSorts[$sort], $dir);

        $ranks = $query
            ->paginate($perPage)
            ->withQueryString();

        return Inertia::render('admin/ranks/index', [
            'ranks' => $ranks,
            'filters' => [
                'q' => $q,
                'sort' => $sort,
                'dir' => $dir,
                'per_page' => $perPage,
            ],
        ]);
    }

    public function create()
    {
        return Inertia::render('admin/ranks/create');
    }

    public function show(Rank $rank)
    {
        $activitiesRaw = $rank->activities()
            ->with('causer')
            ->latest()
            ->get();

        $userIds = $activitiesRaw
            ->flatMap(function ($a) {
                $changes = $a->attribute_changes?->toArray() ?? [];
                if (! isset($changes['old']) && ! isset($changes['attributes'])) {
                    $changes = [
                        'old' => $a->properties['old'] ?? null,
                        'attributes' => $a->properties['attributes'] ?? null,
                    ];
                }

                $attrs = is_array($changes['attributes'] ?? null) ? $changes['attributes'] : [];
                $old = is_array($changes['old'] ?? null) ? $changes['old'] : [];

                return collect([$attrs, $old])
                    ->flatMap(fn (array $arr) => collect($arr)->filter(fn ($v, $k) => $k === 'user_id' || str_ends_with((string) $k, '_user_id'))->values());
            })
            ->filter(fn ($v) => is_numeric($v))
            ->map(fn ($v) => (int) $v)
            ->unique()
            ->values();

        return Inertia::render('admin/ranks/show', [
            'rank' => $rank->loadCount(['bookings'])->only(['id', 'name', 'created_at', 'bookings_count']),
            'activities' => $activitiesRaw->map(function ($a) {
                $changes = $a->attribute_changes?->toArray() ?? [];
                if (! isset($changes['old']) && ! isset($changes['attributes'])) {
                    $changes = [
                        'old' => $a->properties['old'] ?? null,
                        'attributes' => $a->properties['attributes'] ?? null,
                    ];
                }

                return [
                    'id' => $a->id,
                    'event' => $a->event,
                    'description' => $a->description,
                    'causer' => $a->causer?->name,
                    'changes' => [
                        'old' => $changes['old'] ?? null,
                        'attributes' => $changes['attributes'] ?? null,
                    ],
                    'created_at' => $a->created_at->toISOString(),
                ];
            }),
            'activityLookups' => [
                'users' => User::query()->whereIn('id', $userIds)->pluck('name', 'id'),
            ],
        ]);
    }

    public function store(StoreRankRequest $request)
    {
        Rank::query()->create($request->validated());

        return redirect()->route('admin.ranks.index')->with('success', 'Rank created.');
    }

    public function edit(Rank $rank)
    {
        return Inertia::render('admin/ranks/edit', [
            'rank' => $rank->only(['id', 'name']),
        ]);
    }

    public function update(UpdateRankRequest $request, Rank $rank)
    {
        $rank->update($request->validated());

        return redirect()->route('admin.ranks.index')->with('success', 'Rank updated.');
    }

    public function destroy(Rank $rank)
    {
        $rank->delete();

        return redirect()->route('admin.ranks.index')->with('success', 'Rank deleted.');
    }

    public function importTemplate(): BinaryFileResponse
    {
        return Excel::download(new RankTemplateExport, 'ranks_import_template.xlsx');
    }

    public function importPreview(Request $request): JsonResponse
    {
        $request->validate([
            'file' => ['required', 'file', 'mimes:xlsx,csv,xls', 'max:2048'],
        ]);

        try {
            $rows = Excel::toCollection(new RanksImport, $request->file('file'));

            $names = $rows->flatten(1)
                ->map(function ($row) {
                    $name = $row['name'] ?? null;

                    return empty($name) ? null : $this->sanitizeName((string) $name);
                })
                ->filter()
                ->values();

            $existingNormalised = Rank::query()
                ->pluck('name')
                ->mapWithKeys(fn (string $n) => [strtolower($this->sanitizeName($n)) => true])
                ->all();

            $previewRows = $names->map(fn (string $name) => [
                'name' => $name,
                'isDuplicate' => isset($existingNormalised[strtolower($name)]),
            ])->values();

            return response()->json(['rows' => $previewRows]);
        } catch (\Throwable $e) {
            return response()->json(['error' => 'Error reading file: '.$e->getMessage()], 422);
        }
    }

    public function import(Request $request): RedirectResponse
    {
        $request->validate([
            'names' => ['required', 'array', 'min:1'],
            'names.*' => ['required', 'string', 'max:255'],
        ]);

        $existingNormalised = Rank::query()
            ->pluck('name')
            ->mapWithKeys(fn (string $n) => [strtolower($this->sanitizeName($n)) => true])
            ->all();

        foreach ($request->names as $rawName) {
            $name = $this->sanitizeName((string) $rawName);

            if (empty($name)) {
                continue;
            }

            $key = strtolower($name);

            if (! isset($existingNormalised[$key])) {
                Rank::create(['name' => $name]);
                $existingNormalised[$key] = true;
            }
        }

        return redirect()->route('admin.ranks.index')->with('success', 'Ranks imported successfully.');
    }

    private function sanitizeName(string $name): string
    {
        $name = trim($name);
        $name = str_replace("\xC2\xA0", ' ', $name);
        $name = preg_replace('/\s+/', ' ', $name);

        return trim($name);
    }
}

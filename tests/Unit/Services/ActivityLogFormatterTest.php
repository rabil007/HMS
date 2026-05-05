<?php

use App\Models\Client;
use App\Models\Hotel;
use App\Models\User;
use App\Models\Vessel;
use App\Services\ActivityLogFormatter;
use Illuminate\Foundation\Testing\LazilyRefreshDatabase;
use Spatie\Activitylog\Models\Activity;
use Tests\TestCase;

uses(TestCase::class, LazilyRefreshDatabase::class);

beforeEach(function () {
    $this->formatter = new ActivityLogFormatter;
});

function freshSubject(): User
{
    $subject = User::factory()->createOne();
    Activity::query()->delete();

    return $subject;
}

it('returns the documented wire shape with default user lookup', function () {
    $causer = User::factory()->createOne(['name' => 'Causer Cathy']);
    $named = User::factory()->createOne(['name' => 'Named Nathan']);
    $subject = freshSubject();

    activity()
        ->causedBy($causer)
        ->performedOn($subject)
        ->withProperties([
            'old' => ['name' => 'Old name'],
            'attributes' => ['name' => 'New name', 'user_id' => $named->id],
        ])
        ->event('updated')
        ->log('test');

    $result = $this->formatter->format($subject->fresh());

    expect($result)->toHaveKeys(['activities', 'activityLookups']);
    expect($result['activityLookups'])->toHaveKey('users');
    expect($result['activityLookups']['users']->all())
        ->toBe([$named->id => 'Named Nathan']);

    $row = $result['activities']->first();
    expect(array_keys($row))->toEqualCanonicalizing([
        'id', 'event', 'description', 'causer', 'changes', 'created_at',
    ]);
    expect($row['causer'])->toBe('Causer Cathy');
    expect($row['changes']['attributes']['name'])->toBe('New name');
    expect($row['changes']['old']['name'])->toBe('Old name');
});

it('folds *_user_id keys into the user_id bucket', function () {
    $approver = User::factory()->createOne(['name' => 'Approver Anna']);
    $rejecter = User::factory()->createOne(['name' => 'Rejecter Roger']);
    $subject = freshSubject();

    activity()
        ->performedOn($subject)
        ->withProperties([
            'attributes' => [
                'approved_by_user_id' => $approver->id,
                'rejected_by_user_id' => $rejecter->id,
            ],
        ])
        ->log('test');

    $result = $this->formatter->format($subject->fresh());

    expect($result['activityLookups']['users']->keys()->sort()->values()->all())
        ->toBe(collect([$approver->id, $rejecter->id])->sort()->values()->all());
    expect($result['activityLookups']['users']->all())
        ->toMatchArray([
            $approver->id => 'Approver Anna',
            $rejecter->id => 'Rejecter Roger',
        ]);
});

it('resolves multi-key lookups with table-name buckets', function () {
    $hotel = Hotel::query()->create(['name' => 'Grand Plaza']);
    $client = Client::query()->create(['name' => 'Acme Maritime']);
    $vessel = Vessel::query()->create(['name' => 'MV Test']);
    $namedUser = User::factory()->createOne(['name' => 'Owner Olive']);
    $subject = freshSubject();

    activity()
        ->performedOn($subject)
        ->withProperties([
            'old' => ['name' => 'Previous'],
            'attributes' => [
                'hotel_id' => $hotel->id,
                'client_id' => $client->id,
                'vessel_id' => $vessel->id,
                'user_id' => $namedUser->id,
            ],
        ])
        ->log('test');

    $result = $this->formatter->format($subject->fresh(), [
        'user_id' => User::class,
        'hotel_id' => Hotel::class,
        'client_id' => Client::class,
        'vessel_id' => Vessel::class,
    ]);

    expect($result['activityLookups'])->toHaveKeys(['users', 'hotels', 'clients', 'vessels']);
    expect($result['activityLookups']['hotels']->all())->toBe([$hotel->id => 'Grand Plaza']);
    expect($result['activityLookups']['clients']->all())->toBe([$client->id => 'Acme Maritime']);
    expect($result['activityLookups']['vessels']->all())->toBe([$vessel->id => 'MV Test']);
    expect($result['activityLookups']['users']->all())->toBe([$namedUser->id => 'Owner Olive']);
});

it('falls back to the legacy properties payload when attribute_changes is empty', function () {
    $named = User::factory()->createOne(['name' => 'Legacy Larry']);
    $subject = freshSubject();

    $activity = activity()
        ->performedOn($subject)
        ->withProperties([
            'old' => ['name' => 'Old'],
            'attributes' => ['name' => 'New', 'user_id' => $named->id],
        ])
        ->log('test');

    $activity->forceFill(['attribute_changes' => null])->save();

    $result = $this->formatter->format($subject->fresh());

    expect($result['activityLookups']['users']->all())->toBe([$named->id => 'Legacy Larry']);
    expect($result['activities']->first()['changes']['attributes']['name'])->toBe('New');
    expect($result['activities']->first()['changes']['old']['name'])->toBe('Old');
});

it('returns empty lookups when no IDs are present in the changes', function () {
    $subject = freshSubject();

    activity()
        ->performedOn($subject)
        ->withProperties([
            'old' => ['name' => 'Old'],
            'attributes' => ['name' => 'New'],
        ])
        ->log('test');

    $result = $this->formatter->format($subject->fresh());

    expect($result['activityLookups']['users']->all())->toBe([]);
    expect($result['activities'])->toHaveCount(1);
});

it('returns activities ordered newest first', function () {
    $subject = freshSubject();

    $first = activity()->performedOn($subject)->event('first')->log('test');
    $first->forceFill(['created_at' => now()->subHour()])->save();

    $second = activity()->performedOn($subject)->event('second')->log('test');
    $second->forceFill(['created_at' => now()])->save();

    $result = $this->formatter->format($subject->fresh());

    expect($result['activities']->pluck('event')->all())->toBe(['second', 'first']);
});

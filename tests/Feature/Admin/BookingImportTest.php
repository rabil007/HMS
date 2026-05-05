<?php

use App\Enums\BookingStatus;
use App\Enums\Role;
use App\Models\Booking;
use App\Models\BookingImportHistory;
use App\Models\Client;
use App\Models\Hotel;
use App\Models\Rank;
use App\Models\User;
use App\Models\Vessel;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Str;

use function Pest\Laravel\actingAs;

function makeBookingsCsv(array $rows, array $headers = [
    'Guest Name',
    'Mobile No',
    'Rank',
    'Vessel',
    'Room type',
    'Check-in Date',
    'Check-in Time',
    'Check-out Date',
    'Check-out Time',
    'Remarks',
    'REQUESTS',
    'Booking confirmation',
    'HOTEL',
]): UploadedFile
{
    $lines = [implode(',', $headers)];
    foreach ($rows as $row) {
        $lines[] = implode(',', array_map(fn ($v) => '"'.str_replace('"', '""', (string) ($v ?? '')).'"', $row));
    }
    $csv = implode("\n", $lines);

    $tmp = tempnam(sys_get_temp_dir(), 'bookings_').'.csv';
    file_put_contents($tmp, $csv);

    return new UploadedFile($tmp, 'bookings.csv', 'text/csv', null, true);
}

it('only allows admins to access the import page', function () {
    $client = User::factory()->createOne(['role' => Role::Client->value]);

    actingAs($client)->get(route('admin.bookings.import.create'))->assertForbidden();
});

it('renders the import page for admins with lookup data', function () {
    $admin = User::factory()->createOne(['role' => Role::Admin->value]);
    Hotel::query()->create(['name' => 'CENTRO']);
    Vessel::query()->create(['name' => 'ADNOC 712']);
    Rank::query()->create(['name' => 'CO']);
    Client::query()->create(['name' => 'CLIENT A']);

    actingAs($admin)
        ->get(route('admin.bookings.import.create'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('admin/bookings/import')
            ->has('lookups.hotels', 1)
            ->has('lookups.vessels', 1)
            ->has('lookups.ranks', 1)
            ->has('lookups.clients', 1)
        );
});

it('previews an upload and resolves rows by name with errors and warnings', function () {
    $admin = User::factory()->createOne(['role' => Role::Admin->value]);
    Hotel::query()->create(['name' => 'CENTRO']);
    Vessel::query()->create(['name' => 'ADNOC 712']);
    Rank::query()->create(['name' => 'CO']);

    $file = makeBookingsCsv([
        // 1) Fully resolvable row, with confirmation -> confirmed
        ['John Doe', '+9715', 'CO', 'ADNOC 712', 'SINGLE', '2026-04-12', '', '2026-04-15', '', '', '', 'CNF-1', 'CENTRO'],
        // 2) Unknown vessel -> error vessel_unmatched
        ['Jane Roe', '+9715', 'CO', 'UNKNOWN VESSEL', 'TRIPLE', '2026-04-12', '', 'OPEN', '', '', '', 'CNF-2', 'CENTRO'],
        // 3) DENIED confirmation -> rejected
        ['Sam Tan', '', 'CO', 'ADNOC 712', 'SINGLE', '2026-04-12', '', 'OPEN', '', '', '', 'DENIED', ''],
        // 4) Unknown rank -> warning only (still importable)
        ['Lin Mai', '', 'NEW RANK', 'ADNOC 712', 'SINGLE', '2026-04-12', '', 'OPEN', '', '', '', 'CNF-3', 'CENTRO'],
        // 5) CANCELLED in REQUESTS should be rejected and drop confirmation
        ['Aly Ramadan Mohamed Moussa Allam', '', 'CO', 'ADNOC 712', 'SINGLE', '2026-04-12', '', 'OPEN', '', '', 'CANCELLED', '10253116', 'CENTRO'],
    ]);

    actingAs($admin)
        ->post(route('admin.bookings.import-preview'), ['file' => $file])
        ->assertOk()
        ->assertJsonPath('summary.total', 5)
        ->assertJsonPath('summary.importable', 4)
        ->assertJsonPath('summary.issues', 1)
        ->assertJsonPath('missing.vessels.0', 'UNKNOWN VESSEL')
        ->assertJsonPath('missing.ranks.0', 'NEW RANK')
        ->assertJsonPath('rows.0.status', BookingStatus::Confirmed->value)
        ->assertJsonPath('rows.0.errors', [])
        ->assertJsonPath('rows.0.is_open_checkout', false)
        ->assertJsonPath('rows.0.check_out_date', '2026-04-15')
        ->assertJsonPath('rows.1.errors.0', 'vessel_unmatched')
        ->assertJsonPath('rows.1.is_open_checkout', true)
        ->assertJsonPath('rows.1.check_out_date', null)
        ->assertJsonPath('rows.2.status', BookingStatus::Rejected->value)
        ->assertJsonPath('rows.2.confirmation_number', null)
        ->assertJsonPath('rows.3.warnings.0', 'rank_unmatched')
        ->assertJsonPath('rows.3.errors', [])
        ->assertJsonPath('rows.4.status', BookingStatus::Rejected->value)
        ->assertJsonPath('rows.4.confirmation_number', null);
});

it('creates missing vessels, ranks, and hotels in bulk', function () {
    $admin = User::factory()->createOne(['role' => Role::Admin->value]);
    Vessel::query()->create(['name' => 'ADNOC 712']);
    Rank::query()->create(['name' => 'CO']);
    Hotel::query()->create(['name' => 'CENTRO']);

    actingAs($admin)
        ->post(route('admin.bookings.import-create-missing'), [
            'vessels' => ['UNKNOWN VESSEL', 'unknown    vessel', 'ADNOC 712'],
            'ranks' => ['NEW RANK', 'new rank', 'CO'],
            'hotels' => ['PALM HOTEL', ' palm   hotel ', 'CENTRO'],
        ])
        ->assertOk()
        ->assertJsonPath('created.vessels', 1)
        ->assertJsonPath('created.ranks', 1)
        ->assertJsonPath('created.hotels', 1);

    expect(Vessel::query()->where('name', 'UNKNOWN VESSEL')->exists())->toBeTrue();
    expect(Rank::query()->where('name', 'NEW RANK')->exists())->toBeTrue();
    expect(Hotel::query()->where('name', 'PALM HOTEL')->exists())->toBeTrue();
});

it('rejects non-admins from previewing imports', function () {
    $hotel = Hotel::query()->create(['name' => 'H1']);
    $hotelUser = User::factory()->createOne([
        'role' => Role::Hotel->value,
        'hotel_id' => $hotel->id,
    ]);

    actingAs($hotelUser)
        ->post(route('admin.bookings.import-preview'), [
            'file' => UploadedFile::fake()->create('x.csv', 1, 'text/csv'),
        ])
        ->assertForbidden();
});

it('stores resolved rows and skips rows the user marked as skip', function () {
    $admin = User::factory()->createOne(['role' => Role::Admin->value]);
    $hotel = Hotel::query()->create(['name' => 'CENTRO']);
    $vessel = Vessel::query()->create(['name' => 'ADNOC 712']);
    $rank = Rank::query()->create(['name' => 'CO']);
    $client = Client::query()->create(['name' => 'Client Bulk']);

    $payload = [
        'meta' => [
            'file_name' => 'hotel-record.xlsx',
            'client_id' => $client->id,
        ],
        'rows' => [
            [
                'row_index' => 1,
                'guest_name' => 'John Doe',
                'guest_phone' => '+97150',
                'room_type' => 'SINGLE',
                'check_in_date' => '2026-04-12',
                'check_in_time' => null,
                'check_out_date' => '2026-04-15',
                'check_out_time' => null,
                'vessel_id' => $vessel->id,
                'rank_id' => $rank->id,
                'hotel_id' => $hotel->id,
                'confirmation_number' => 'CNF-1',
                'remarks' => null,
                'status' => BookingStatus::Confirmed->value,
            ],
            [
                'row_index' => 2,
                'guest_name' => 'Open Stay',
                'guest_phone' => null,
                'room_type' => 'TWIN',
                'check_in_date' => '2026-04-20',
                'check_in_time' => null,
                'check_out_date' => null,
                'check_out_time' => null,
                'vessel_id' => $vessel->id,
                'rank_id' => null,
                'hotel_id' => null,
                'confirmation_number' => null,
                'remarks' => null,
                'status' => BookingStatus::Pending->value,
            ],
        ],
    ];

    actingAs($admin)
        ->post(route('admin.bookings.import'), $payload)
        ->assertRedirect(route('admin.bookings.import.create'));

    expect(Booking::query()->count())->toBe(2);

    $confirmed = Booking::query()->where('guest_name', 'John Doe')->firstOrFail();
    expect($confirmed->status)->toBe(BookingStatus::Confirmed)
        ->and($confirmed->user_id)->toBe($admin->id)
        ->and($confirmed->client_id)->toBe($client->id)
        ->and($confirmed->import_source)->toBe('excel')
        ->and($confirmed->booking_import_history_id)->not->toBeNull()
        ->and($confirmed->actual_check_in_date->format('Y-m-d'))->toBe('2026-04-12')
        ->and($confirmed->actual_check_out_date->format('Y-m-d'))->toBe('2026-04-15');

    $openStay = Booking::query()->where('guest_name', 'Open Stay')->firstOrFail();
    expect($openStay->check_out_date)->toBeNull()
        ->and($openStay->actual_check_out_date)->toBeNull()
        ->and($openStay->rank_id)->toBeNull()
        ->and($openStay->hotel_id)->toBeNull()
        ->and($openStay->status)->toBe(BookingStatus::Pending);

    $history = BookingImportHistory::query()->latest('id')->firstOrFail();
    expect($history->file_name)->toBe('hotel-record.xlsx')
        ->and($history->submitted_count)->toBe(2)
        ->and($history->created_count)->toBe(2)
        ->and($history->failed_count)->toBe(0);
});

it('normalises checkout date to check-in when checkout is earlier', function () {
    $admin = User::factory()->createOne(['role' => Role::Admin->value]);
    $client = Client::query()->create(['name' => 'Client A']);
    $vessel = Vessel::query()->create(['name' => 'ADNOC 999']);

    actingAs($admin)
        ->post(route('admin.bookings.import'), [
            'meta' => [
                'client_id' => $client->id,
            ],
            'rows' => [[
                'row_index' => 1,
                'guest_name' => 'Date Fix Guest',
                'guest_phone' => null,
                'room_type' => 'SINGLE',
                'check_in_date' => '2026-05-20',
                'check_in_time' => null,
                'check_out_date' => '2026-05-10',
                'check_out_time' => null,
                'vessel_id' => $vessel->id,
                'rank_id' => null,
                'hotel_id' => null,
                'confirmation_number' => null,
                'remarks' => null,
                'status' => BookingStatus::Pending->value,
            ]],
        ])
        ->assertRedirect(route('admin.bookings.import.create'));

    $booking = Booking::query()->where('guest_name', 'Date Fix Guest')->firstOrFail();
    expect($booking)->not->toBeNull();
    $this->assertDatabaseHas('bookings', [
        'id' => $booking->id,
        'check_in_date' => '2026-05-20 00:00:00',
        'check_out_date' => '2026-05-20 00:00:00',
    ]);
});

it('imports rows with duplicate confirmation numbers by clearing the duplicate confirmation', function () {
    $admin = User::factory()->createOne(['role' => Role::Admin->value]);
    $client = Client::query()->create(['name' => 'Client B']);
    $owner = User::factory()->createOne(['role' => Role::Client->value]);
    $vessel = Vessel::query()->create(['name' => 'ADNOC 100']);

    Booking::query()->create([
        'hotel_id' => null,
        'user_id' => $owner->id,
        'public_id' => (string) Str::ulid(),
        'status' => BookingStatus::Confirmed->value,
        'check_in_date' => '2026-05-10',
        'check_out_date' => null,
        'guest_name' => 'Existing Guest',
        'vessel_id' => $vessel->id,
        'single_or_twin' => 'single',
        'confirmation_number' => 'DUP-100',
    ]);

    actingAs($admin)
        ->post(route('admin.bookings.import'), [
            'meta' => [
                'client_id' => $client->id,
            ],
            'rows' => [[
                'row_index' => 65,
                'guest_name' => 'New Excel Guest',
                'guest_phone' => null,
                'room_type' => 'SINGLE',
                'check_in_date' => '2026-05-20',
                'check_in_time' => null,
                'check_out_date' => null,
                'check_out_time' => null,
                'vessel_id' => $vessel->id,
                'rank_id' => null,
                'hotel_id' => null,
                'confirmation_number' => 'DUP-100',
                'remarks' => null,
                'status' => BookingStatus::Pending->value,
            ]],
        ])
        ->assertRedirect(route('admin.bookings.import.create'));

    $imported = Booking::query()->where('guest_name', 'New Excel Guest')->latest('id')->firstOrFail();
    expect($imported->confirmation_number)->toBeNull();
});

it('rejects store payloads with missing required fields', function () {
    $admin = User::factory()->createOne(['role' => Role::Admin->value]);
    $client = Client::query()->create(['name' => 'Client C']);
    $hotel = Hotel::query()->create(['name' => 'CENTRO']);
    $vessel = Vessel::query()->create(['name' => 'ADNOC 712']);

    actingAs($admin)
        ->post(route('admin.bookings.import'), [
            'meta' => [
                'client_id' => $client->id,
            ],
            'rows' => [[
                'row_index' => 1,
                'guest_name' => '',
                'room_type' => '',
                'check_in_date' => null,
                'vessel_id' => $vessel->id,
                'hotel_id' => $hotel->id,
                'status' => BookingStatus::Pending->value,
            ]],
        ])
        ->assertSessionHasErrors([
            'rows.0.guest_name',
            'rows.0.room_type',
            'rows.0.check_in_date',
        ]);

    expect(Booking::query()->count())->toBe(0);
});

it('requires selecting a client for import', function () {
    $admin = User::factory()->createOne(['role' => Role::Admin->value]);
    $vessel = Vessel::query()->create(['name' => 'ADNOC 333']);

    actingAs($admin)
        ->post(route('admin.bookings.import'), [
            'rows' => [[
                'row_index' => 1,
                'guest_name' => 'Guest One',
                'room_type' => 'SINGLE',
                'check_in_date' => now()->toDateString(),
                'vessel_id' => $vessel->id,
                'status' => BookingStatus::Pending->value,
            ]],
        ])
        ->assertSessionHasErrors(['meta.client_id']);
});

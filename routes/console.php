<?php

use App\Models\Booking;
use App\Models\Guest;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Artisan::command('guests:backfill', function () {
    $updated = 0;
    $createdGuests = 0;
    $cacheByPhone = [];
    $cacheByEmail = [];
    $cacheByName = [];

    Booking::query()
        ->whereNull('guest_id')
        ->orderBy('id')
        ->chunkById(200, function ($bookings) use (&$updated, &$createdGuests, &$cacheByPhone, &$cacheByEmail, &$cacheByName) {
            /** @var \Illuminate\Support\Collection<int, Booking> $bookings */
            foreach ($bookings as $booking) {
                /** @var Booking $booking */
                $name = is_string($booking->guest_name) ? trim($booking->guest_name) : '';
                if ($name === '') {
                    continue;
                }

                $phone = is_string($booking->guest_phone) ? trim($booking->guest_phone) : '';
                $email = is_string($booking->guest_email) ? trim(mb_strtolower($booking->guest_email)) : '';
                $guest = null;

                if ($phone !== '') {
                    $guest = $cacheByPhone[$phone] ?? Guest::query()->where('phone', $phone)->first();
                    if ($guest !== null) {
                        $cacheByPhone[$phone] = $guest;
                    }
                }

                if ($guest === null && $email !== '') {
                    $guest = $cacheByEmail[$email] ?? Guest::query()->where('email', $email)->first();
                    if ($guest !== null) {
                        $cacheByEmail[$email] = $guest;
                    }
                }

                if ($guest === null) {
                    $nameKey = mb_strtolower(preg_replace('/\s+/', ' ', $name));
                    $guest = $cacheByName[$nameKey] ?? null;

                    if ($guest === null) {
                        $guest = DB::transaction(function () use ($booking, $name, $phone, $email, &$createdGuests) {
                            $payload = [
                                'full_name' => $name,
                                'phone' => $phone !== '' ? $phone : null,
                                'email' => $email !== '' ? $email : null,
                                'created_by_user_id' => $booking->user_id,
                            ];

                            $guest = Guest::query()->create($payload);
                            $createdGuests++;

                            return $guest;
                        });
                    }

                    $cacheByName[$nameKey] = $guest;
                }

                $booking->guest_id = $guest->id;
                $booking->save();
                $updated++;
            }
        });

    $this->info("Backfill complete. Updated bookings: {$updated}, created guests: {$createdGuests}.");
})->purpose('Backfill guest_id on existing bookings');

<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Artisan::command('guests:backfill', function () {
    $this->warn('Guest snapshot columns were removed from bookings. No backfill is needed.');
})->purpose('No-op: guest data now comes from guest_id only');

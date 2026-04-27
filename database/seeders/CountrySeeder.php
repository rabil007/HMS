<?php

namespace Database\Seeders;

use App\Models\Country;
use Illuminate\Database\Seeder;

class CountrySeeder extends Seeder
{
    public function run(): void
    {
        $countries = [
            ['name' => 'United Arab Emirates', 'iso2' => 'AE', 'dial_code' => '+971'],
            ['name' => 'Saudi Arabia', 'iso2' => 'SA', 'dial_code' => '+966'],
            ['name' => 'Qatar', 'iso2' => 'QA', 'dial_code' => '+974'],
            ['name' => 'Kuwait', 'iso2' => 'KW', 'dial_code' => '+965'],
            ['name' => 'Bahrain', 'iso2' => 'BH', 'dial_code' => '+973'],
            ['name' => 'Oman', 'iso2' => 'OM', 'dial_code' => '+968'],
            ['name' => 'India', 'iso2' => 'IN', 'dial_code' => '+91'],
            ['name' => 'Pakistan', 'iso2' => 'PK', 'dial_code' => '+92'],
            ['name' => 'Sri Lanka', 'iso2' => 'LK', 'dial_code' => '+94'],
            ['name' => 'Bangladesh', 'iso2' => 'BD', 'dial_code' => '+880'],
            ['name' => 'Philippines', 'iso2' => 'PH', 'dial_code' => '+63'],
            ['name' => 'United Kingdom', 'iso2' => 'GB', 'dial_code' => '+44'],
            ['name' => 'United States', 'iso2' => 'US', 'dial_code' => '+1'],
            ['name' => 'Canada', 'iso2' => 'CA', 'dial_code' => '+1'],
            ['name' => 'Germany', 'iso2' => 'DE', 'dial_code' => '+49'],
            ['name' => 'France', 'iso2' => 'FR', 'dial_code' => '+33'],
            ['name' => 'Italy', 'iso2' => 'IT', 'dial_code' => '+39'],
            ['name' => 'Spain', 'iso2' => 'ES', 'dial_code' => '+34'],
            ['name' => 'China', 'iso2' => 'CN', 'dial_code' => '+86'],
            ['name' => 'Japan', 'iso2' => 'JP', 'dial_code' => '+81'],
            ['name' => 'South Korea', 'iso2' => 'KR', 'dial_code' => '+82'],
            ['name' => 'Australia', 'iso2' => 'AU', 'dial_code' => '+61'],
        ];

        foreach ($countries as $c) {
            Country::query()->updateOrCreate(
                ['iso2' => $c['iso2']],
                ['name' => $c['name'], 'dial_code' => $c['dial_code']]
            );
        }
    }
}

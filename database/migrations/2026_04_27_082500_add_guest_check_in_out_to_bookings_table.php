<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('bookings', function (Blueprint $table) {
            $table->dateTime('guest_check_in')->nullable()->after('actual_check_out_date');
            $table->dateTime('guest_check_out')->nullable()->after('guest_check_in');

            $table->index(['hotel_id', 'guest_check_in']);
        });
    }

    public function down(): void
    {
        Schema::table('bookings', function (Blueprint $table) {
            $table->dropIndex(['hotel_id', 'guest_check_in']);
            $table->dropColumn(['guest_check_in', 'guest_check_out']);
        });
    }
};


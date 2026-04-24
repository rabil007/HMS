<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('bookings', function (Blueprint $table) {
            $table->date('actual_check_in_date')->nullable()->after('check_out_date');
            $table->date('actual_check_out_date')->nullable()->after('actual_check_in_date');

            $table->index(['hotel_id', 'actual_check_in_date']);
        });
    }

    public function down(): void
    {
        Schema::table('bookings', function (Blueprint $table) {
            $table->dropIndex(['hotel_id', 'actual_check_in_date']);
            $table->dropColumn(['actual_check_in_date', 'actual_check_out_date']);
        });
    }
};


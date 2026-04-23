<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('bookings', function (Blueprint $table) {
            $table->index(['hotel_id', 'status']);
            $table->index(['user_id', 'status']);
            $table->index(['hotel_id', 'room_id', 'check_in_date', 'check_out_date']);
            $table->index(['hotel_id', 'check_in_date']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('bookings', function (Blueprint $table) {
            $table->dropIndex(['hotel_id', 'status']);
            $table->dropIndex(['user_id', 'status']);
            $table->dropIndex(['hotel_id', 'room_id', 'check_in_date', 'check_out_date']);
            $table->dropIndex(['hotel_id', 'check_in_date']);
        });
    }
};

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
        Schema::table('booking_events', function (Blueprint $table) {
            $table->index(['booking_id']);
            $table->index(['actor_user_id']);
            $table->index(['booking_id', 'event_type']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('booking_events', function (Blueprint $table) {
            $table->dropIndex(['booking_id']);
            $table->dropIndex(['actor_user_id']);
            $table->dropIndex(['booking_id', 'event_type']);
        });
    }
};

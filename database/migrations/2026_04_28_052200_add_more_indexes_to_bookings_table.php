<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('bookings', function (Blueprint $table) {
            $table->index(['hotel_id', 'client_id']);
            $table->index(['client_id', 'status']);
            $table->index(['hotel_id', 'confirmation_number']);
            $table->unique(['confirmation_number']);
        });
    }

    public function down(): void
    {
        Schema::table('bookings', function (Blueprint $table) {
            $table->dropUnique(['confirmation_number']);
            $table->dropIndex(['hotel_id', 'client_id']);
            $table->dropIndex(['client_id', 'status']);
            $table->dropIndex(['hotel_id', 'confirmation_number']);
        });
    }
};

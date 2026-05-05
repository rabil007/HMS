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
            $table->dropForeign(['hotel_id']);
            $table->unsignedBigInteger('hotel_id')->nullable()->change();
            $table->foreign('hotel_id')->references('id')->on('hotels')->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('bookings', function (Blueprint $table) {
            $table->dropForeign(['hotel_id']);
            $table->unsignedBigInteger('hotel_id')->nullable(false)->change();
            $table->foreign('hotel_id')->references('id')->on('hotels')->cascadeOnDelete();
        });
    }
};

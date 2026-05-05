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
            $table->string('import_source', 20)->default('manual')->index();
            $table->foreignId('booking_import_history_id')->nullable()->after('import_source')->constrained('booking_import_histories')->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('bookings', function (Blueprint $table) {
            $table->dropForeign(['booking_import_history_id']);
            $table->dropColumn(['import_source', 'booking_import_history_id']);
        });
    }
};

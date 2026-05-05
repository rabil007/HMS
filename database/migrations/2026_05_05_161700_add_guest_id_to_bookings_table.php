<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('bookings', function (Blueprint $table) {
            $table->foreignId('guest_id')
                ->nullable()
                ->after('user_id')
                ->constrained('guests')
                ->nullOnDelete();
            $table->index('guest_id');
        });
    }

    public function down(): void
    {
        Schema::table('bookings', function (Blueprint $table) {
            $table->dropForeign(['guest_id']);
            $table->dropIndex(['guest_id']);
            $table->dropColumn('guest_id');
        });
    }
};

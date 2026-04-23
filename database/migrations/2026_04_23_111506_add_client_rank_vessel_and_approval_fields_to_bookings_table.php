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
            $table->foreignId('client_id')->nullable()->after('user_id')->constrained('clients')->nullOnDelete();
            $table->foreignId('rank_id')->nullable()->after('guest_name')->constrained()->nullOnDelete();
            $table->foreignId('vessel_id')->nullable()->after('rank_id')->constrained()->nullOnDelete();
            $table->string('single_or_twin')->nullable()->after('vessel_id');

            $table->string('confirmation_number')->nullable()->after('single_or_twin');
            $table->text('remarks')->nullable()->after('confirmation_number');
            $table->timestamp('approved_at')->nullable()->after('remarks');
            $table->foreignId('approved_by_user_id')->nullable()->after('approved_at')->constrained('users')->nullOnDelete();

            $table->timestamp('rejected_at')->nullable()->after('approved_by_user_id');
            $table->foreignId('rejected_by_user_id')->nullable()->after('rejected_at')->constrained('users')->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('bookings', function (Blueprint $table) {
            $table->dropConstrainedForeignId('rejected_by_user_id');
            $table->dropColumn('rejected_at');
            $table->dropConstrainedForeignId('approved_by_user_id');
            $table->dropColumn('approved_at');
            $table->dropColumn(['remarks', 'confirmation_number', 'single_or_twin']);
            $table->dropConstrainedForeignId('vessel_id');
            $table->dropConstrainedForeignId('rank_id');
            $table->dropConstrainedForeignId('client_id');
        });
    }
};

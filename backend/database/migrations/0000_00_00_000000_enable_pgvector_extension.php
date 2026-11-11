<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (DB::getDriverName() === 'pgsql') {
            DB::statement('CREATE EXTENSION IF NOT EXISTS vector;');
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Don't drop extension automatically in down() to avoid accidental data loss
    }
};

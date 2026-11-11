<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        $dimensions = config('ai.embedding_dimensions', 384);

        Schema::create('document_chunks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('document_id')->constrained('documents')->cascadeOnDelete();
            $table->foreignId('workspace_id')->constrained('workspaces')->cascadeOnDelete();
            $table->integer('chunk_index');
            $table->integer('page_number')->default(1);
            $table->text('content');
            $table->integer('token_count')->default(0);
            $table->jsonb('metadata')->nullable();

            // SQLite test fallback for embedding column
            if (DB::getDriverName() !== 'pgsql') {
                $table->text('embedding')->nullable();
            }

            $table->timestamps();

            $table->index(['workspace_id', 'document_id']);
            $table->unique(['document_id', 'chunk_index']);
        });

        // Add native pgvector column and HNSW cosine index when using PostgreSQL
        if (DB::getDriverName() === 'pgsql') {
            DB::statement("ALTER TABLE document_chunks ADD COLUMN embedding vector({$dimensions});");
            DB::statement("CREATE INDEX document_chunks_embedding_cosine_idx ON document_chunks USING hnsw (embedding vector_cosine_ops);");
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('document_chunks');
    }
};

<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\DB;

class DocumentChunk extends Model
{
    use HasFactory;

    protected $fillable = [
        'document_id',
        'workspace_id',
        'chunk_index',
        'page_number',
        'content',
        'token_count',
        'metadata',
        'embedding',
    ];

    protected function casts(): array
    {
        return [
            'chunk_index' => 'integer',
            'page_number' => 'integer',
            'token_count' => 'integer',
            'metadata' => 'array',
        ];
    }

    /**
     * Parent document.
     */
    public function document(): BelongsTo
    {
        return $this->belongsTo(Document::class);
    }

    /**
     * Workspace this chunk belongs to.
     */
    public function workspace(): BelongsTo
    {
        return $this->belongsTo(Workspace::class);
    }

    /**
     * Format a PHP float array into a PostgreSQL vector string literal: [0.12, 0.34, ...].
     *
     * @param  array<float>  $vector
     */
    public static function formatVector(array $vector): string
    {
        return '[' . implode(',', $vector) . ']';
    }

    /**
     * Scope to perform cosine similarity search using pgvector.
     *
     * @param  Builder  $query
     * @param  array<float>  $queryVector
     * @param  int  $limit
     * @param  float|null  $minSimilarity (e.g. 0.4 = 40% similarity)
     */
    public function scopeSimilarTo(Builder $query, array $queryVector, int $limit = 5, ?float $minSimilarity = null): Builder
    {
        if (DB::getDriverName() !== 'pgsql') {
            return $query->limit($limit);
        }

        $vectorString = static::formatVector($queryVector);

        // In pgvector, cosine distance is <=> operator. Cosine similarity = 1 - cosine_distance
        $query->selectRaw("*, (1 - (embedding <=> '{$vectorString}'::vector)) AS similarity")
            ->orderByRaw("embedding <=> '{$vectorString}'::vector ASC");

        if ($minSimilarity !== null) {
            $maxDistance = 1 - $minSimilarity;
            $query->whereRaw("embedding <=> '{$vectorString}'::vector <= ?", [$maxDistance]);
        }

        return $query->limit($limit);
    }
}

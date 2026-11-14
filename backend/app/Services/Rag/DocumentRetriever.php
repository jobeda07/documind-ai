<?php

namespace App\Services\Rag;

use App\Models\DocumentChunk;
use App\Services\Ai\Contracts\EmbeddingProviderInterface;
use Illuminate\Database\Eloquent\Collection;

class DocumentRetriever
{
    public function __construct(
        protected EmbeddingProviderInterface $embeddingProvider
    ) {
    }

    /**
     * Retrieve the most semantically relevant document chunks for a query within a workspace.
     *
     * @param  int  $workspaceId
     * @param  string  $query
     * @param  int  $topK
     * @param  float|null  $minSimilarity
     * @return Collection<int, DocumentChunk>
     */
    public function retrieve(
        int $workspaceId,
        string $query,
        int $topK = 4,
        ?float $minSimilarity = 0.25
    ): Collection {
        $trimmedQuery = trim($query);
        if ($trimmedQuery === '') {
            return new Collection();
        }

        // Generate query embedding vector
        $queryVector = $this->embeddingProvider->embed($trimmedQuery);

        return DocumentChunk::query()
            ->where('workspace_id', $workspaceId)
            ->with(['document' => function ($q) {
                $q->select('id', 'uuid', 'title', 'original_filename', 'mime_type');
            }])
            ->similarTo($queryVector, $topK, $minSimilarity)
            ->get();
    }
}

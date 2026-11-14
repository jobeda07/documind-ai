<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Document;
use App\Models\DocumentChunk;
use App\Models\Workspace;
use App\Services\Ai\Contracts\EmbeddingProviderInterface;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

class SearchController extends Controller
{
    use ApiResponse;

    /**
     * Unified keyword and semantic search across workspace documents and chunks.
     */
    public function search(
        Request $request,
        Workspace $workspace,
        EmbeddingProviderInterface $embeddingProvider
    ): JsonResponse {
        Gate::authorize('view', $workspace);

        $query = trim($request->string('q'));
        if ($query === '') {
            return $this->success([
                'documents' => [],
                'chunks' => [],
                'query' => '',
            ]);
        }

        $limit = min((int) $request->input('limit', 5), 20);

        // 1. Keyword search on documents title & filename
        $documents = $workspace->documents()
            ->where(function ($q) use ($query) {
                $term = '%' . strtolower($query) . '%';
                $q->whereRaw('LOWER(title) LIKE ?', [$term])
                    ->orWhereRaw('LOWER(original_filename) LIKE ?', [$term]);
            })
            ->limit($limit)
            ->get(['id', 'uuid', 'title', 'original_filename', 'mime_type', 'page_count', 'status', 'created_at']);

        // 2. Vector semantic search on chunks
        $chunks = [];
        try {
            $queryVector = $embeddingProvider->embed($query);

            $chunks = DocumentChunk::query()
                ->where('workspace_id', $workspace->id)
                ->with(['document' => function ($q) {
                    $q->select('id', 'uuid', 'title', 'original_filename', 'mime_type');
                }])
                ->similarTo($queryVector, $limit, 0.20)
                ->get()
                ->map(function ($chunk) {
                    return [
                        'id' => $chunk->id,
                        'chunk_index' => $chunk->chunk_index,
                        'page_number' => $chunk->page_number,
                        'content_snippet' => mb_substr($chunk->content, 0, 180) . '...',
                        'similarity' => round((float) ($chunk->similarity ?? 0), 4),
                        'document' => [
                            'id' => $chunk->document?->id,
                            'title' => $chunk->document?->title,
                            'filename' => $chunk->document?->original_filename,
                        ],
                    ];
                });
        } catch (\Throwable $e) {
            // If vector embedding fails, fallback cleanly to keyword search
        }

        return $this->success([
            'query' => $query,
            'documents' => $documents,
            'chunks' => $chunks,
        ], 'Search completed successfully');
    }
}

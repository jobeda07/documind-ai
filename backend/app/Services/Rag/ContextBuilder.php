<?php

namespace App\Services\Rag;

use App\Models\DocumentChunk;
use Illuminate\Support\Collection;

class ContextBuilder
{
    protected int $maxTokenBudget;

    public function __construct(int $maxTokenBudget = 1500)
    {
        $this->maxTokenBudget = $maxTokenBudget;
    }

    /**
     * Build numbered citation context and metadata list from retrieved chunks.
     *
     * @param  Collection<int, DocumentChunk>  $chunks
     * @return array{
     *     context: string,
     *     citations: array<int, array{
     *         index: int,
     *         label: string,
     *         document_id: int,
     *         document_title: string,
     *         filename: string,
     *         page_number: int,
     *         chunk_index: int,
     *         similarity: float,
     *         content_snippet: string
     *     }>,
     *     total_tokens: int
     * }
     */
    public function build(Collection $chunks): array
    {
        $contextParts = [];
        $citations = [];
        $accumulatedTokens = 0;
        $index = 1;

        foreach ($chunks as $chunk) {
            $chunkTokens = $chunk->token_count ?: (int) ceil(mb_strlen($chunk->content) / 3.5);

            // Respect token budget
            if ($accumulatedTokens + $chunkTokens > $this->maxTokenBudget && ! empty($contextParts)) {
                break;
            }

            $docTitle = $chunk->document?->title ?? 'Document';
            $filename = $chunk->document?->original_filename ?? 'document';
            $page = $chunk->page_number ?: 1;
            $label = "[Source {$index}]";

            $contextParts[] = "{$label} (File: {$filename}, Page: {$page})\n{$chunk->content}";

            $citations[] = [
                'index' => $index,
                'label' => $label,
                'document_id' => $chunk->document_id,
                'document_title' => $docTitle,
                'filename' => $filename,
                'page_number' => $page,
                'chunk_index' => $chunk->chunk_index,
                'similarity' => round((float) ($chunk->similarity ?? 0), 4),
                'content_snippet' => mb_substr($chunk->content, 0, 160) . '...',
            ];

            $accumulatedTokens += $chunkTokens;
            $index++;
        }

        return [
            'context' => implode("\n\n---\n\n", $contextParts),
            'citations' => $citations,
            'total_tokens' => $accumulatedTokens,
        ];
    }
}

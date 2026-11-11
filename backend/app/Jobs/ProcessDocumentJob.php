<?php

namespace App\Jobs;

use App\Models\Document;
use App\Models\DocumentChunk;
use App\Services\Ai\Contracts\EmbeddingProviderInterface;
use App\Services\Document\DocumentTextExtractor;
use App\Services\Document\TextChunker;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Throwable;

class ProcessDocumentJob implements ShouldQueue
{
    use Queueable;

    /**
     * The number of times the job may be attempted.
     */
    public int $tries = 3;

    /**
     * The number of seconds the job can run before timing out.
     */
    public int $timeout = 180;

    /**
     * Create a new job instance.
     */
    public function __construct(public Document $document)
    {
    }

    /**
     * Execute the document processing pipeline:
     * 1. Multi-format text extraction (PDF, DOCX, TXT)
     * 2. Overlapping text chunking with page metadata
     * 3. Vector embedding generation via AI provider
     * 4. PostgreSQL/pgvector storage
     */
    public function handle(
        DocumentTextExtractor $extractor,
        TextChunker $chunker,
        EmbeddingProviderInterface $embeddingProvider
    ): void {
        $this->document->update([
            'status' => 'processing',
            'error_message' => null,
        ]);

        try {
            Log::info("Processing Document ID {$this->document->id} [{$this->document->title}]");

            // Step 1: Text extraction
            $result = $extractor->extract(
                $this->document->file_path,
                $this->document->mime_type
            );

            // Step 2: Split text into structured overlapping chunks
            $chunks = $chunker->chunkPages($result['pages']);

            Log::info("Document ID {$this->document->id} split into " . count($chunks) . " chunks.");

            // Step 3 & 4: Generate embeddings and store in DB within a transaction
            DB::transaction(function () use ($chunks, $result, $embeddingProvider) {
                // Remove old chunks if reprocessing
                $this->document->chunks()->delete();

                $isPgsql = DB::getDriverName() === 'pgsql';

                foreach ($chunks as $chunk) {
                    // Generate embedding vector
                    $vector = $embeddingProvider->embed($chunk['content']);

                    DocumentChunk::create([
                        'document_id' => $this->document->id,
                        'workspace_id' => $this->document->workspace_id,
                        'chunk_index' => $chunk['chunk_index'],
                        'page_number' => $chunk['page_number'],
                        'content' => $chunk['content'],
                        'token_count' => $chunk['token_count'],
                        'metadata' => $chunk['metadata'],
                        'embedding' => $isPgsql ? DocumentChunk::formatVector($vector) : json_encode($vector),
                    ]);
                }

                // Update document to completed
                $this->document->update([
                    'status' => 'completed',
                    'page_count' => $result['page_count'],
                    'character_count' => $result['character_count'],
                    'word_count' => $result['word_count'],
                    'metadata' => array_merge($this->document->metadata ?? [], [
                        'total_chunks' => count($chunks),
                        'embedding_model' => $embeddingProvider->getModelName(),
                        'embedding_dimensions' => $embeddingProvider->getDimensions(),
                        'processed_at' => now()->toIso8601String(),
                    ]),
                ]);
            });

            Log::info("Document ID {$this->document->id} successfully embedded and saved with " . count($chunks) . " chunks.");
        } catch (Throwable $e) {
            Log::error("Failed to process & embed Document ID {$this->document->id}: " . $e->getMessage(), [
                'exception' => $e,
            ]);

            $this->document->update([
                'status' => 'failed',
                'error_message' => $e->getMessage(),
            ]);

            throw $e;
        }
    }
}

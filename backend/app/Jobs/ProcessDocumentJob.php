<?php

namespace App\Jobs;

use App\Models\Document;
use App\Services\Document\DocumentTextExtractor;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Log;
use Throwable;

class ProcessDocumentJob implements ShouldQueue
{
    use Queueable;

    /**
     * Create a new job instance.
     */
    public function __construct(public Document $document)
    {
    }

    /**
     * Execute the job.
     */
    public function handle(DocumentTextExtractor $extractor): void
    {
        $this->document->update([
            'status' => 'processing',
            'error_message' => null,
        ]);

        try {
            Log::info("Starting document text extraction for Document ID {$this->document->id} ({$this->document->title})");

            $result = $extractor->extract(
                $this->document->file_path,
                $this->document->mime_type
            );

            $this->document->update([
                'status' => 'completed',
                'page_count' => $result['page_count'],
                'character_count' => $result['character_count'],
                'word_count' => $result['word_count'],
                'metadata' => array_merge($this->document->metadata ?? [], [
                    'extracted_pages_count' => count($result['pages']),
                    'processed_at' => now()->toIso8601String(),
                ]),
            ]);

            Log::info("Document ID {$this->document->id} extraction completed successfully. Pages: {$result['page_count']}, Words: {$result['word_count']}");
        } catch (Throwable $e) {
            Log::error("Failed to process Document ID {$this->document->id}: " . $e->getMessage(), [
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

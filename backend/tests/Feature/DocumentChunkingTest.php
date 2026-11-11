<?php

namespace Tests\Feature;

use App\Jobs\ProcessDocumentJob;
use App\Models\Document;
use App\Models\DocumentChunk;
use App\Models\User;
use App\Models\Workspace;
use App\Services\Ai\Mock\MockEmbeddingProvider;
use App\Services\Document\DocumentTextExtractor;
use App\Services\Document\TextChunker;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class DocumentChunkingTest extends TestCase
{
    use RefreshDatabase;

    public function test_document_processing_pipeline_creates_chunks_and_embeddings(): void
    {
        Storage::fake('local');

        $user = User::factory()->create();
        $workspace = Workspace::create([
            'name' => 'Chunk WS',
            'slug' => 'chunk-ws',
            'owner_id' => $user->id,
        ]);
        $workspace->users()->attach($user->id, ['role' => 'owner']);

        $filePath = 'documents/sample_contract.txt';
        $content = "DocuMind AI Platform Architecture.\n\nSection 1: Vector Storage.\nAll chunks are embedded and indexed in PostgreSQL using pgvector.\n\nSection 2: Semantic Retrieval.\nQueries are matched against chunks using cosine similarity.";
        Storage::disk('local')->put($filePath, $content);

        $document = Document::create([
            'uuid' => (string) \Illuminate\Support\Str::uuid(),
            'workspace_id' => $workspace->id,
            'user_id' => $user->id,
            'title' => 'Sample Contract',
            'original_filename' => 'sample_contract.txt',
            'file_path' => $filePath,
            'mime_type' => 'text/plain',
            'file_size' => strlen($content),
            'status' => 'pending',
        ]);

        $job = new ProcessDocumentJob($document);
        $job->handle(
            new DocumentTextExtractor(),
            new TextChunker(chunkSize: 100, chunkOverlap: 20),
            new MockEmbeddingProvider(384)
        );

        $document->refresh();

        $this->assertEquals('completed', $document->status);
        $this->assertGreaterThan(0, $document->chunks()->count());

        $firstChunk = $document->chunks()->first();
        $this->assertNotNull($firstChunk);
        $this->assertEquals(0, $firstChunk->chunk_index);
        $this->assertNotEmpty($firstChunk->content);
        $this->assertEquals($workspace->id, $firstChunk->workspace_id);
    }
}

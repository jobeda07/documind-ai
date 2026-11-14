<?php

namespace Tests\Feature;

use App\Models\Document;
use App\Models\DocumentChunk;
use App\Models\User;
use App\Models\Workspace;
use App\Services\Ai\Contracts\EmbeddingProviderInterface;
use App\Services\Ai\Contracts\LlmProviderInterface;
use App\Services\Ai\Mock\MockEmbeddingProvider;
use App\Services\Ai\Mock\MockLlmProvider;
use App\Services\Rag\ContextBuilder;
use App\Services\Rag\DocumentRetriever;
use App\Services\Rag\RagService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RagServiceTest extends TestCase
{
    use RefreshDatabase;

    protected User $user;
    protected Workspace $workspace;
    protected Document $document;

    protected function setUp(): void
    {
        parent::setUp();

        $this->user = User::factory()->create();
        $this->workspace = Workspace::factory()->create(['owner_id' => $this->user->id]);
        $this->workspace->users()->attach($this->user->id, ['role' => 'owner']);

        $this->document = Document::create([
            'uuid' => (string) \Illuminate\Support\Str::uuid(),
            'workspace_id' => $this->workspace->id,
            'user_id' => $this->user->id,
            'title' => 'HR Handbook',
            'original_filename' => 'hr_handbook.pdf',
            'file_path' => 'documents/test.pdf',
            'mime_type' => 'application/pdf',
            'file_size' => 1024,
            'status' => 'completed',
        ]);
    }

    public function test_rag_service_returns_grounded_answer_with_citations(): void
    {
        $mockEmbedding = new MockEmbeddingProvider(384);
        $mockLlm = new MockLlmProvider('mock-llm', 'According to [Source 1], employees are entitled to 20 days of leave.');

        $vector = $mockEmbedding->embed('leave policy');

        DocumentChunk::create([
            'document_id' => $this->document->id,
            'workspace_id' => $this->workspace->id,
            'chunk_index' => 0,
            'page_number' => 5,
            'content' => 'Annual leave policy: full-time employees receive 20 days paid leave.',
            'token_count' => 15,
            'embedding' => DocumentChunk::formatVector($vector),
        ]);

        $retriever = new DocumentRetriever($mockEmbedding);
        $contextBuilder = new ContextBuilder();
        $rag = new RagService($retriever, $contextBuilder, $mockLlm);

        $result = $rag->answer($this->workspace->id, 'How many days of leave do employees get?');

        $this->assertTrue($result['has_grounding']);
        $this->assertCount(1, $result['citations']);
        $this->assertEquals('[Source 1]', $result['citations'][0]['label']);
        $this->assertEquals('hr_handbook.pdf', $result['citations'][0]['filename']);
        $this->assertStringContainsString('According to [Source 1]', $result['answer']);
    }

    public function test_rag_service_handles_empty_workspace_gracefully(): void
    {
        $mockEmbedding = new MockEmbeddingProvider(384);
        $mockLlm = new MockLlmProvider();

        $retriever = new DocumentRetriever($mockEmbedding);
        $contextBuilder = new ContextBuilder();
        $rag = new RagService($retriever, $contextBuilder, $mockLlm);

        $emptyWorkspace = Workspace::factory()->create(['owner_id' => $this->user->id]);

        $result = $rag->answer($emptyWorkspace->id, 'What is the leave policy?');

        $this->assertFalse($result['has_grounding']);
        $this->assertEmpty($result['citations']);
        $this->assertStringContainsString("couldn't find any relevant information", $result['answer']);
    }
}

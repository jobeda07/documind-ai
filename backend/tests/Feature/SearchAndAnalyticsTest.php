<?php

namespace Tests\Feature;

use App\Models\Conversation;
use App\Models\Document;
use App\Models\DocumentChunk;
use App\Models\User;
use App\Models\Workspace;
use App\Services\Ai\Contracts\EmbeddingProviderInterface;
use App\Services\Ai\Mock\MockEmbeddingProvider;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class SearchAndAnalyticsTest extends TestCase
{
    use RefreshDatabase;

    protected User $user;
    protected Workspace $workspace;
    protected Document $document;

    protected function setUp(): void
    {
        parent::setUp();

        $mockEmbedding = new MockEmbeddingProvider(384);
        $this->app->instance(EmbeddingProviderInterface::class, $mockEmbedding);

        $this->user = User::factory()->create();
        $this->workspace = Workspace::factory()->create(['owner_id' => $this->user->id]);
        $this->workspace->users()->attach($this->user->id, ['role' => 'owner']);

        $this->document = Document::create([
            'uuid' => (string) Str::uuid(),
            'workspace_id' => $this->workspace->id,
            'user_id' => $this->user->id,
            'title' => 'Financial Audit Report',
            'original_filename' => 'audit_report.pdf',
            'file_path' => 'documents/audit.pdf',
            'mime_type' => 'application/pdf',
            'file_size' => 1024 * 1024,
            'page_count' => 12,
            'status' => 'completed',
        ]);

        $vector = $mockEmbedding->embed('financial overview');
        DocumentChunk::create([
            'document_id' => $this->document->id,
            'workspace_id' => $this->workspace->id,
            'chunk_index' => 0,
            'page_number' => 1,
            'content' => 'Q4 financial audit completed with zero compliance exceptions.',
            'token_count' => 12,
            'embedding' => DocumentChunk::formatVector($vector),
        ]);
    }

    public function test_user_can_search_documents_and_chunks(): void
    {
        Sanctum::actingAs($this->user);

        $response = $this->getJson("/api/v1/workspaces/{$this->workspace->id}/search?q=Financial");

        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonCount(1, 'data.documents');
    }

    public function test_user_can_get_analytics_overview(): void
    {
        Sanctum::actingAs($this->user);

        $response = $this->getJson("/api/v1/workspaces/{$this->workspace->id}/analytics?range=30d");

        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.total_chunks', 1)
            ->assertJsonPath('data.status_summary.completed', 1);
    }

    public function test_user_can_get_document_chunks(): void
    {
        Sanctum::actingAs($this->user);

        $response = $this->getJson("/api/v1/workspaces/{$this->workspace->id}/documents/{$this->document->id}/chunks");

        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonCount(1, 'data.chunks')
            ->assertJsonPath('data.document.title', 'Financial Audit Report');
    }

    public function test_user_can_export_conversation_as_markdown_and_json(): void
    {
        Sanctum::actingAs($this->user);

        $conversation = Conversation::create([
            'workspace_id' => $this->workspace->id,
            'user_id' => $this->user->id,
            'title' => 'Audit Questions',
        ]);

        $conversation->messages()->create([
            'role' => 'user',
            'content' => 'What was the Q4 audit result?',
        ]);

        $conversation->messages()->create([
            'role' => 'assistant',
            'content' => 'Zero compliance exceptions found [Source 1].',
            'citations' => [
                [
                    'label' => '[Source 1]',
                    'filename' => 'audit_report.pdf',
                    'page_number' => 1,
                    'content_snippet' => 'Q4 audit completed...',
                ],
            ],
        ]);

        // Test markdown export
        $mdResponse = $this->get("/api/v1/workspaces/{$this->workspace->id}/conversations/{$conversation->id}/export?format=markdown");
        $mdResponse->assertStatus(200);
        $this->assertStringContainsString('# Chat: Audit Questions', $mdResponse->getContent());
        $this->assertStringContainsString('Zero compliance exceptions', $mdResponse->getContent());

        // Test json export
        $jsonResponse = $this->getJson("/api/v1/workspaces/{$this->workspace->id}/conversations/{$conversation->id}/export?format=json");
        $jsonResponse->assertStatus(200)
            ->assertJsonPath('conversation.title', 'Audit Questions')
            ->assertJsonCount(2, 'messages');
    }
}

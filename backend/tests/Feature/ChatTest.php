<?php

namespace Tests\Feature;

use App\Models\Conversation;
use App\Models\Document;
use App\Models\DocumentChunk;
use App\Models\User;
use App\Models\Workspace;
use App\Services\Ai\Contracts\EmbeddingProviderInterface;
use App\Services\Ai\Contracts\LlmProviderInterface;
use App\Services\Ai\Mock\MockEmbeddingProvider;
use App\Services\Ai\Mock\MockLlmProvider;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ChatTest extends TestCase
{
    use RefreshDatabase;

    protected User $user;
    protected Workspace $workspace;

    protected function setUp(): void
    {
        parent::setUp();

        // Bind mock providers for deterministic, fast feature testing
        $mockEmbedding = new MockEmbeddingProvider(384);
        $mockLlm = new MockLlmProvider('mock-llm', 'According to [Source 1], the policy requires approval.');

        $this->app->instance(EmbeddingProviderInterface::class, $mockEmbedding);
        $this->app->instance(LlmProviderInterface::class, $mockLlm);

        $this->user = User::factory()->create();
        $this->workspace = Workspace::factory()->create(['owner_id' => $this->user->id]);
        $this->workspace->users()->attach($this->user->id, ['role' => 'owner']);
    }

    public function test_user_can_create_conversation(): void
    {
        Sanctum::actingAs($this->user);

        $response = $this->postJson("/api/v1/workspaces/{$this->workspace->id}/conversations", [
            'title' => 'Project Kickoff',
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.title', 'Project Kickoff');

        $this->assertDatabaseHas('conversations', [
            'workspace_id' => $this->workspace->id,
            'title' => 'Project Kickoff',
        ]);
    }

    public function test_user_can_list_conversations(): void
    {
        Sanctum::actingAs($this->user);

        Conversation::create([
            'workspace_id' => $this->workspace->id,
            'user_id' => $this->user->id,
            'title' => 'First Chat',
        ]);

        $response = $this->getJson("/api/v1/workspaces/{$this->workspace->id}/conversations");

        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonCount(1, 'data');
    }

    public function test_user_can_send_message_and_receive_rag_answer_with_citations(): void
    {
        Sanctum::actingAs($this->user);

        // Create sample document and chunk
        $doc = Document::create([
            'uuid' => (string) Str::uuid(),
            'workspace_id' => $this->workspace->id,
            'user_id' => $this->user->id,
            'title' => 'Safety Manual',
            'original_filename' => 'safety_manual.pdf',
            'file_path' => 'documents/safety.pdf',
            'mime_type' => 'application/pdf',
            'file_size' => 2048,
            'status' => 'completed',
        ]);

        $mockEmbedding = $this->app->make(EmbeddingProviderInterface::class);
        $vector = $mockEmbedding->embed('safety gear');

        DocumentChunk::create([
            'document_id' => $doc->id,
            'workspace_id' => $this->workspace->id,
            'chunk_index' => 0,
            'page_number' => 2,
            'content' => 'All workers must wear high-visibility helmets and safety boots at all times.',
            'token_count' => 15,
            'embedding' => DocumentChunk::formatVector($vector),
        ]);

        $conversation = Conversation::create([
            'workspace_id' => $this->workspace->id,
            'user_id' => $this->user->id,
            'title' => 'New Conversation',
        ]);

        $response = $this->postJson("/api/v1/workspaces/{$this->workspace->id}/conversations/{$conversation->id}/messages", [
            'content' => 'What safety gear is required?',
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.user_message.role', 'user')
            ->assertJsonPath('data.assistant_message.role', 'assistant')
            ->assertJsonPath('data.assistant_message.content', 'According to [Source 1], the policy requires approval.');

        // Verify conversation title was updated
        $conversation->refresh();
        $this->assertEquals('What safety gear is required?', $conversation->title);

        // Verify messages in DB
        $this->assertDatabaseHas('messages', [
            'conversation_id' => $conversation->id,
            'role' => 'user',
        ]);
        $this->assertDatabaseHas('messages', [
            'conversation_id' => $conversation->id,
            'role' => 'assistant',
        ]);
    }

    public function test_user_cannot_access_conversation_of_another_workspace(): void
    {
        $otherUser = User::factory()->create();
        $otherWorkspace = Workspace::factory()->create(['owner_id' => $otherUser->id]);

        $conversation = Conversation::create([
            'workspace_id' => $otherWorkspace->id,
            'user_id' => $otherUser->id,
            'title' => 'Private Chat',
        ]);

        Sanctum::actingAs($this->user);

        $response = $this->getJson("/api/v1/workspaces/{$otherWorkspace->id}/conversations/{$conversation->id}");

        $response->assertStatus(403);
    }

    public function test_user_can_delete_conversation(): void
    {
        Sanctum::actingAs($this->user);

        $conversation = Conversation::create([
            'workspace_id' => $this->workspace->id,
            'user_id' => $this->user->id,
            'title' => 'Temporary Chat',
        ]);

        $response = $this->deleteJson("/api/v1/workspaces/{$this->workspace->id}/conversations/{$conversation->id}");

        $response->assertStatus(200)
            ->assertJsonPath('success', true);

        $this->assertDatabaseMissing('conversations', [
            'id' => $conversation->id,
        ]);
    }
}

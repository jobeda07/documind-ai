<?php

namespace Tests\Feature;

use App\Jobs\ProcessDocumentJob;
use App\Models\Document;
use App\Models\User;
use App\Models\Workspace;
use App\Services\Document\DocumentTextExtractor;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;
use ZipArchive;

class DocumentTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Storage::fake('local');
    }

    public function test_unauthenticated_user_cannot_access_documents(): void
    {
        $workspace = Workspace::factory()->create([
            'owner_id' => User::factory()->create()->id,
        ]);

        $response = $this->getJson("/api/v1/workspaces/{$workspace->id}/documents");
        $response->assertStatus(401);
    }

    public function test_user_cannot_access_documents_of_another_workspace(): void
    {
        $owner = User::factory()->create();
        $intruder = User::factory()->create();

        $workspace = Workspace::create([
            'name' => 'Owner WS',
            'slug' => 'owner-ws',
            'owner_id' => $owner->id,
        ]);
        $workspace->users()->attach($owner->id, ['role' => 'owner']);

        $response = $this->actingAs($intruder)
            ->getJson("/api/v1/workspaces/{$workspace->id}/documents");

        $response->assertStatus(403);
    }

    public function test_user_can_upload_valid_document_and_job_is_dispatched(): void
    {
        Queue::fake();

        $user = User::factory()->create();
        $workspace = Workspace::create([
            'name' => 'My WS',
            'slug' => 'my-ws',
            'owner_id' => $user->id,
        ]);
        $workspace->users()->attach($user->id, ['role' => 'owner']);

        $file = UploadedFile::fake()->createWithContent('contract.txt', 'This is a sample legal contract for DocuMind AI.');

        $response = $this->actingAs($user)
            ->postJson("/api/v1/workspaces/{$workspace->id}/documents", [
                'file' => $file,
                'title' => 'Master Services Agreement',
            ]);

        $response->assertStatus(201)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.title', 'Master Services Agreement')
            ->assertJsonPath('data.original_filename', 'contract.txt')
            ->assertJsonPath('data.status', 'pending');

        $this->assertDatabaseHas('documents', [
            'workspace_id' => $workspace->id,
            'title' => 'Master Services Agreement',
            'status' => 'pending',
        ]);

        Queue::assertPushed(ProcessDocumentJob::class);
    }

    public function test_user_cannot_upload_disallowed_file_types(): void
    {
        $user = User::factory()->create();
        $workspace = Workspace::create([
            'name' => 'My WS',
            'slug' => 'my-ws-2',
            'owner_id' => $user->id,
        ]);
        $workspace->users()->attach($user->id, ['role' => 'owner']);

        $invalidFile = UploadedFile::fake()->create('malicious.exe', 500, 'application/x-msdownload');

        $response = $this->actingAs($user)
            ->postJson("/api/v1/workspaces/{$workspace->id}/documents", [
                'file' => $invalidFile,
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['file']);
    }

    public function test_extractor_extracts_txt_content_accurately(): void
    {
        $content = "DocuMind AI Platform Architecture\n\nChapter 1: Overview\nThis platform processes PDF, DOCX, and TXT files.";
        $tempPath = 'test_documents/sample.txt';
        Storage::disk('local')->put($tempPath, $content);

        $extractor = new DocumentTextExtractor();
        $result = $extractor->extract($tempPath, 'text/plain', 'local');

        $this->assertEquals(1, $result['page_count']);
        $this->assertStringContainsString('DocuMind AI Platform Architecture', $result['pages'][0]['text']);
        $this->assertGreaterThan(0, $result['word_count']);
        $this->assertGreaterThan(0, $result['character_count']);
    }

    public function test_extractor_extracts_docx_content_accurately(): void
    {
        $fullPath = Storage::disk('local')->path('test_documents/sample.docx');
        @mkdir(dirname($fullPath), 0777, true);

        $zip = new ZipArchive();
        $zip->open($fullPath, ZipArchive::CREATE | ZipArchive::OVERWRITE);
        $zip->addFromString(
            'word/document.xml',
            '<?xml version="1.0" encoding="UTF-8"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body><w:p><w:r><w:t>DocuMind AI DOCX text extraction successful.</w:t></w:r></w:p></w:body></w:document>'
        );
        $zip->close();

        $extractor = new DocumentTextExtractor();
        $result = $extractor->extract('test_documents/sample.docx', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'local');

        $this->assertGreaterThanOrEqual(1, $result['page_count']);
        $this->assertStringContainsString('DocuMind AI DOCX text extraction successful.', $result['pages'][0]['text']);
    }

    public function test_process_document_job_processes_and_completes_document(): void
    {
        $user = User::factory()->create();
        $workspace = Workspace::create([
            'name' => 'Process WS',
            'slug' => 'process-ws',
            'owner_id' => $user->id,
        ]);
        $workspace->users()->attach($user->id, ['role' => 'owner']);

        $filePath = 'documents/sample.txt';
        Storage::disk('local')->put($filePath, "Line 1 of intelligence document.\n\nLine 2 of extracted content.");

        $document = Document::create([
            'uuid' => (string) \Illuminate\Support\Str::uuid(),
            'workspace_id' => $workspace->id,
            'user_id' => $user->id,
            'title' => 'Test Document',
            'original_filename' => 'sample.txt',
            'file_path' => $filePath,
            'mime_type' => 'text/plain',
            'file_size' => 100,
            'status' => 'pending',
        ]);

        $job = new ProcessDocumentJob($document);
        $job->handle(
            new DocumentTextExtractor(),
            new \App\Services\Document\TextChunker(),
            new \App\Services\Ai\Mock\MockEmbeddingProvider(384)
        );

        $document->refresh();

        $this->assertEquals('completed', $document->status);
        $this->assertGreaterThan(0, $document->word_count);
        $this->assertGreaterThan(0, $document->character_count);
        $this->assertNull($document->error_message);
    }

    public function test_document_deletion_removes_file_and_record(): void
    {
        $user = User::factory()->create();
        $workspace = Workspace::create([
            'name' => 'Delete WS',
            'slug' => 'delete-ws',
            'owner_id' => $user->id,
        ]);
        $workspace->users()->attach($user->id, ['role' => 'owner']);

        $filePath = 'documents/to_delete.txt';
        Storage::disk('local')->put($filePath, 'Content to delete');

        $document = Document::create([
            'uuid' => (string) \Illuminate\Support\Str::uuid(),
            'workspace_id' => $workspace->id,
            'user_id' => $user->id,
            'title' => 'To Delete',
            'original_filename' => 'to_delete.txt',
            'file_path' => $filePath,
            'mime_type' => 'text/plain',
            'file_size' => 50,
            'status' => 'completed',
        ]);

        $response = $this->actingAs($user)
            ->deleteJson("/api/v1/workspaces/{$workspace->id}/documents/{$document->id}");

        $response->assertStatus(200);

        $this->assertDatabaseMissing('documents', ['id' => $document->id]);
        Storage::disk('local')->assertMissing($filePath);
    }
}

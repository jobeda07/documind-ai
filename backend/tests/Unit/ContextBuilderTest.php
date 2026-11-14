<?php

namespace Tests\Unit;

use App\Models\Document;
use App\Models\DocumentChunk;
use App\Services\Rag\ContextBuilder;
use Illuminate\Database\Eloquent\Collection;
use Tests\TestCase;

class ContextBuilderTest extends TestCase
{
    public function test_context_builder_creates_numbered_citations(): void
    {
        $builder = new ContextBuilder(1000);

        $doc = new Document([
            'title' => 'Sample Doc',
            'original_filename' => 'sample.pdf',
        ]);
        $doc->id = 42;

        $chunk1 = new DocumentChunk([
            'document_id' => 42,
            'workspace_id' => 1,
            'chunk_index' => 0,
            'page_number' => 2,
            'content' => 'First chunk content regarding financial policies.',
            'token_count' => 10,
        ]);
        $chunk1->setRelation('document', $doc);
        $chunk1->similarity = 0.85;

        $chunk2 = new DocumentChunk([
            'document_id' => 42,
            'workspace_id' => 1,
            'chunk_index' => 1,
            'page_number' => 3,
            'content' => 'Second chunk content regarding audit rules.',
            'token_count' => 10,
        ]);
        $chunk2->setRelation('document', $doc);
        $chunk2->similarity = 0.72;

        $result = $builder->build(new Collection([$chunk1, $chunk2]));

        $this->assertStringContainsString('[Source 1]', $result['context']);
        $this->assertStringContainsString('[Source 2]', $result['context']);
        $this->assertStringContainsString('sample.pdf', $result['context']);
        $this->assertCount(2, $result['citations']);
        $this->assertEquals(1, $result['citations'][0]['index']);
        $this->assertEquals('[Source 1]', $result['citations'][0]['label']);
        $this->assertEquals(0.85, $result['citations'][0]['similarity']);
        $this->assertEquals(2, $result['citations'][0]['page_number']);
    }

    public function test_context_builder_respects_token_budget(): void
    {
        $builder = new ContextBuilder(15); // Budget of only 15 tokens

        $doc = new Document(['title' => 'Doc', 'original_filename' => 'doc.pdf']);

        $chunk1 = new DocumentChunk([
            'document_id' => 1,
            'chunk_index' => 0,
            'page_number' => 1,
            'content' => 'Short content.',
            'token_count' => 10,
        ]);
        $chunk1->setRelation('document', $doc);

        $chunk2 = new DocumentChunk([
            'document_id' => 1,
            'chunk_index' => 1,
            'page_number' => 2,
            'content' => 'Another content that exceeds budget.',
            'token_count' => 10,
        ]);
        $chunk2->setRelation('document', $doc);

        $result = $builder->build(new Collection([$chunk1, $chunk2]));

        $this->assertCount(1, $result['citations']);
        $this->assertEquals(10, $result['total_tokens']);
    }
}

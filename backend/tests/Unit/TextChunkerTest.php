<?php

namespace Tests\Unit;

use App\Services\Document\TextChunker;
use Tests\TestCase;

class TextChunkerTest extends TestCase
{
    public function test_chunk_pages_preserves_page_numbers_and_metadata(): void
    {
        $chunker = new TextChunker(chunkSize: 100, chunkOverlap: 20);

        $pages = [
            [
                'page_number' => 1,
                'text' => 'This is the first page of the document intelligence platform DocuMind AI. It contains important introductory information.',
            ],
            [
                'page_number' => 2,
                'text' => 'This is the second page. It describes vector embeddings and pgvector database search capabilities.',
            ],
        ];

        $chunks = $chunker->chunkPages($pages);

        $this->assertNotEmpty($chunks);
        $this->assertEquals(1, $chunks[0]['page_number']);
        $this->assertEquals(0, $chunks[0]['chunk_index']);
        $this->assertArrayHasKey('metadata', $chunks[0]);
        $this->assertArrayHasKey('char_start', $chunks[0]['metadata']);

        // Check second page chunk
        $page2Chunks = array_values(array_filter($chunks, fn ($c) => $c['page_number'] === 2));
        $this->assertNotEmpty($page2Chunks);
        $this->assertEquals(2, $page2Chunks[0]['page_number']);
    }

    public function test_chunk_text_creates_overlapping_windows(): void
    {
        $chunker = new TextChunker(chunkSize: 50, chunkOverlap: 15);
        $text = 'Sentence number one. Sentence number two. Sentence number three. Sentence number four.';

        $chunks = $chunker->chunkText($text);

        $this->assertGreaterThan(1, count($chunks));
        $this->assertLessThanOrEqual(70, mb_strlen($chunks[0]['text']));
    }

    public function test_chunker_handles_empty_pages_gracefully(): void
    {
        $chunker = new TextChunker();
        $pages = [
            ['page_number' => 1, 'text' => '   '],
            ['page_number' => 2, 'text' => ''],
        ];

        $chunks = $chunker->chunkPages($pages);
        $this->assertEmpty($chunks);
    }
}

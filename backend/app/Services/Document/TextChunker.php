<?php

namespace App\Services\Document;

class TextChunker
{
    protected int $chunkSize;
    protected int $chunkOverlap;

    public function __construct(?int $chunkSize = null, ?int $chunkOverlap = null)
    {
        $defaultSize = function_exists('config') ? (int) config('ai.chunk_size', 500) : 500;
        $defaultOverlap = function_exists('config') ? (int) config('ai.chunk_overlap', 100) : 100;

        $this->chunkSize = $chunkSize ?? ($defaultSize ?: 500);
        $this->chunkOverlap = $chunkOverlap ?? ($defaultOverlap ?: 100);

        if ($this->chunkOverlap >= $this->chunkSize) {
            $this->chunkOverlap = (int) floor($this->chunkSize / 2);
        }
    }

    /**
     * Chunk document pages preserving page numbers and source metadata.
     *
     * @param  array<array{page_number: int, text: string}>  $pages
     * @return array<array{
     *     chunk_index: int,
     *     page_number: int,
     *     content: string,
     *     token_count: int,
     *     metadata: array<string, mixed>
     * }>
     */
    public function chunkPages(array $pages): array
    {
        $chunks = [];
        $globalIndex = 0;

        foreach ($pages as $page) {
            $pageNumber = $page['page_number'] ?? 1;
            $text = trim($page['text'] ?? '');

            if ($text === '') {
                continue;
            }

            $pageChunks = $this->chunkText($text);

            foreach ($pageChunks as $pageChunk) {
                $content = trim($pageChunk['text']);
                if ($content === '') {
                    continue;
                }

                $chunks[] = [
                    'chunk_index' => $globalIndex++,
                    'page_number' => $pageNumber,
                    'content' => $content,
                    'token_count' => $this->estimateTokens($content),
                    'metadata' => [
                        'page' => $pageNumber,
                        'char_start' => $pageChunk['start'],
                        'char_end' => $pageChunk['end'],
                        'length' => mb_strlen($content),
                    ],
                ];
            }
        }

        return $chunks;
    }

    /**
     * Split a single continuous text string using a sliding window with overlap.
     *
     * @return array<array{text: string, start: int, end: int}>
     */
    public function chunkText(string $text): array
    {
        $textLength = mb_strlen($text);

        if ($textLength <= $this->chunkSize) {
            return [[
                'text' => $text,
                'start' => 0,
                'end' => $textLength,
            ]];
        }

        $chunks = [];
        $start = 0;

        while ($start < $textLength) {
            $end = min($start + $this->chunkSize, $textLength);

            // If not at the end of the text, try to break on a sentence or paragraph boundary
            if ($end < $textLength) {
                $boundary = $this->findNaturalBoundary($text, $start, $end);
                if ($boundary !== false) {
                    $end = $boundary;
                }
            }

            $chunkText = mb_substr($text, $start, $end - $start);

            $chunks[] = [
                'text' => $chunkText,
                'start' => $start,
                'end' => $end,
            ];

            // Next window begins by stepping forward by (chunkLength - overlap)
            $step = max(1, ($end - $start) - $this->chunkOverlap);
            $start += $step;
        }

        return $chunks;
    }

    /**
     * Find a paragraph or sentence break near the end of the chunk.
     */
    protected function findNaturalBoundary(string $text, int $start, int $end): int|false
    {
        $slice = mb_substr($text, $start, $end - $start);

        // Look for double newline (paragraph break) in the last 30% of the slice
        $minPos = (int) floor(($end - $start) * 0.7);

        $doubleNl = mb_strrpos($slice, "\n\n");
        if ($doubleNl !== false && $doubleNl >= $minPos) {
            return $start + $doubleNl + 2;
        }

        // Look for sentence terminators (. ! ?) followed by space
        if (preg_match('/[.!?]\s+[A-Z0-9]/u', $slice, $match, PREG_OFFSET_CAPTURE, $minPos)) {
            return $start + $match[0][1] + 1;
        }

        // Look for single newline
        $singleNl = mb_strrpos($slice, "\n");
        if ($singleNl !== false && $singleNl >= $minPos) {
            return $start + $singleNl + 1;
        }

        // Look for space
        $lastSpace = mb_strrpos($slice, ' ');
        if ($lastSpace !== false && $lastSpace >= $minPos) {
            return $start + $lastSpace + 1;
        }

        return false;
    }

    /**
     * Approximate token count (roughly ~4 characters per token in English).
     */
    protected function estimateTokens(string $text): int
    {
        return (int) ceil(mb_strlen($text) / 4);
    }
}

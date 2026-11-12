<?php

namespace App\Services\Document;

class TextChunker
{
    protected int $chunkSize;
    protected int $chunkOverlap;

    public function __construct(?int $chunkSize = null, ?int $chunkOverlap = null)
    {
        $defaultSize = function_exists('config') ? (int) config('ai.chunk_size', 350) : 350;
        $defaultOverlap = function_exists('config') ? (int) config('ai.chunk_overlap', 60) : 60;

        $this->chunkSize = $chunkSize ?? ($defaultSize ?: 350);
        $this->chunkOverlap = $chunkOverlap ?? ($defaultOverlap ?: 60);

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
                if ($boundary !== false && $boundary > $start + $this->chunkOverlap) {
                    $end = $boundary;
                }
            }

            $chunkText = mb_substr($text, $start, $end - $start);
            $trimmed = trim($chunkText);

            if ($trimmed !== '') {
                $chunks[] = [
                    'text' => $chunkText,
                    'start' => $start,
                    'end' => $end,
                ];
            }

            // If this window reached or exceeded the end of the text, stop chunking
            if ($end >= $textLength) {
                break;
            }

            // Next window begins by stepping forward
            $step = max(20, ($end - $start) - $this->chunkOverlap);
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
        $sliceLen = mb_strlen($slice);

        // Look for boundaries in the last 35% of the slice
        $minPos = (int) floor($sliceLen * 0.65);

        // Natural delimiter priority: paragraph break, Bengali dari, Latin punctuation, newline, space
        $delimiters = [
            "\n\n",
            "।\n",
            "। ",
            ".\n",
            ". ",
            "!\n",
            "! ",
            "?\n",
            "? ",
            "\n",
            " ",
        ];

        foreach ($delimiters as $delim) {
            $pos = mb_strrpos($slice, $delim);
            if ($pos !== false && $pos >= $minPos) {
                return $start + $pos + mb_strlen($delim);
            }
        }

        return false;
    }

    /**
     * Approximate token count (roughly ~4 characters per token in English, higher for multi-byte).
     */
    public function estimateTokens(string $text): int
    {
        return (int) ceil(mb_strlen($text) / 3.5);
    }
}

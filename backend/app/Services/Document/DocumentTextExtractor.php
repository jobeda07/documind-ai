<?php

namespace App\Services\Document;

use Exception;
use Illuminate\Support\Facades\Storage;
use Smalot\PdfParser\Parser as PdfParser;
use ZipArchive;

class DocumentTextExtractor
{
    /**
     * Extract text and per-page content from a given document file path on storage disk.
     *
     * @return array{
     *     pages: array<int, array{page_number: int, text: string}>,
     *     page_count: int,
     *     character_count: int,
     *     word_count: int
     * }
     */
    public function extract(string $storagePath, string $mimeType, string $disk = 'local'): array
    {
        $fullPath = Storage::disk($disk)->path($storagePath);

        if (! file_exists($fullPath)) {
            throw new Exception("Document file not found at path: {$storagePath}");
        }

        $extension = strtolower(pathinfo($storagePath, PATHINFO_EXTENSION));

        $pages = match (true) {
            $extension === 'pdf' || str_contains($mimeType, 'pdf') => $this->extractPdf($fullPath),
            $extension === 'docx' || str_contains($mimeType, 'wordprocessingml') => $this->extractDocx($fullPath),
            default => $this->extractPlainText($fullPath),
        };

        $totalCharacters = 0;
        $totalWords = 0;

        foreach ($pages as &$page) {
            $cleaned = $this->cleanText($page['text']);
            $page['text'] = $cleaned;
            $totalCharacters += mb_strlen($cleaned);
            $totalWords += str_word_count($cleaned);
        }

        // Filter out empty pages if multi-page, or keep one empty page if whole doc empty
        $pages = array_values(array_filter($pages, fn ($p) => trim($p['text']) !== ''));
        if (empty($pages)) {
            $pages = [['page_number' => 1, 'text' => '']];
        }

        return [
            'pages' => $pages,
            'page_count' => count($pages),
            'character_count' => $totalCharacters,
            'word_count' => $totalWords,
        ];
    }

    /**
     * Extract text page-by-page from PDF.
     *
     * @return array<int, array{page_number: int, text: string}>
     */
    protected function extractPdf(string $filePath): array
    {
        $parser = new PdfParser();
        $pdf = $parser->parseFile($filePath);
        $pdfPages = $pdf->getPages();

        $pages = [];
        $pageNumber = 1;

        if (empty($pdfPages)) {
            $pages[] = [
                'page_number' => 1,
                'text' => $pdf->getText(),
            ];
            return $pages;
        }

        foreach ($pdfPages as $pdfPage) {
            $text = $pdfPage->getText();
            $pages[] = [
                'page_number' => $pageNumber++,
                'text' => $text,
            ];
        }

        return $pages;
    }

    /**
     * Extract text from DOCX (Office Open XML).
     *
     * @return array<int, array{page_number: int, text: string}>
     */
    protected function extractDocx(string $filePath): array
    {
        $zip = new ZipArchive();
        if ($zip->open($filePath) !== true) {
            throw new Exception("Unable to open DOCX archive: {$filePath}");
        }

        $xmlIndex = $zip->locateName('word/document.xml');
        if ($xmlIndex === false) {
            $zip->close();
            throw new Exception("Invalid DOCX format: word/document.xml not found");
        }

        $xmlData = $zip->getFromIndex($xmlIndex);
        $zip->close();

        if (empty($xmlData)) {
            return [['page_number' => 1, 'text' => '']];
        }

        // Parse XML and strip tags preserving line breaks between paragraphs
        $text = str_replace('</w:p>', "\n\n", $xmlData);
        $text = str_replace('</w:tr>', "\n", $text);
        $text = str_replace(['<w:tab/>', '<w:cr/>'], ["\t", "\n"], $text);
        $text = strip_tags($text);

        // DOCX doesn't store explicit page breaks unless rendered by Word;
        // we split by virtual pages (~3500 chars) or w:lastRenderedPageBreak
        return $this->splitIntoVirtualPages($text);
    }

    /**
     * Extract plain text file (UTF-8).
     *
     * @return array<int, array{page_number: int, text: string}>
     */
    protected function extractPlainText(string $filePath): array
    {
        $raw = file_get_contents($filePath);
        if ($raw === false) {
            throw new Exception("Unable to read text file: {$filePath}");
        }

        // Convert encoding to UTF-8 if necessary
        $encoding = mb_detect_encoding($raw, ['UTF-8', 'ASCII', 'ISO-8859-1', 'Windows-1252'], true);
        if ($encoding && $encoding !== 'UTF-8') {
            $raw = mb_convert_encoding($raw, 'UTF-8', $encoding);
        }

        // Form-feed characters (\f) are typical page separators in text files
        if (str_contains($raw, "\f")) {
            $rawPages = explode("\f", $raw);
            $pages = [];
            $pageNum = 1;
            foreach ($rawPages as $p) {
                $pages[] = [
                    'page_number' => $pageNum++,
                    'text' => $p,
                ];
            }
            return $pages;
        }

        return $this->splitIntoVirtualPages($raw);
    }

    /**
     * Split continuous text into logical virtual pages (~3000 chars per page).
     *
     * @return array<int, array{page_number: int, text: string}>
     */
    protected function splitIntoVirtualPages(string $text, int $charsPerPage = 3000): array
    {
        $paragraphs = explode("\n\n", $text);
        $pages = [];
        $currentPageText = '';
        $pageNumber = 1;

        foreach ($paragraphs as $para) {
            $trimmed = trim($para);
            if ($trimmed === '') {
                continue;
            }

            if (mb_strlen($currentPageText . $trimmed) > $charsPerPage && ! empty($currentPageText)) {
                $pages[] = [
                    'page_number' => $pageNumber++,
                    'text' => trim($currentPageText),
                ];
                $currentPageText = '';
            }

            $currentPageText .= ($currentPageText === '' ? '' : "\n\n") . $trimmed;
        }

        if (trim($currentPageText) !== '' || empty($pages)) {
            $pages[] = [
                'page_number' => $pageNumber,
                'text' => trim($currentPageText),
            ];
        }

        return $pages;
    }

    /**
     * Clean and normalize UTF-8 whitespace.
     */
    protected function cleanText(string $text): string
    {
        // Remove non-printable control characters except line feeds and tabs
        $cleaned = preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/u', '', $text);
        // Normalize CRLF to LF
        $cleaned = str_replace("\r\n", "\n", $cleaned ?? '');
        $cleaned = str_replace("\r", "\n", $cleaned);
        // Normalize multiple blank lines to double newlines
        $cleaned = preg_replace("/\n{3,}/", "\n\n", $cleaned);

        return trim($cleaned ?? '');
    }
}

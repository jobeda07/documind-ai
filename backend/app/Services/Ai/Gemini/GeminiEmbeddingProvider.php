<?php

namespace App\Services\Ai\Gemini;

use App\Services\Ai\Contracts\EmbeddingProviderInterface;
use Exception;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class GeminiEmbeddingProvider implements EmbeddingProviderInterface
{
    protected string $apiKey;
    protected string $model;
    protected int $dimensions;
    protected int $timeout;

    public function __construct(
        string $apiKey,
        string $model = 'text-embedding-004',
        int $dimensions = 384,
        int $timeout = 60
    ) {
        $this->apiKey = $apiKey;
        $this->model = $model;
        $this->dimensions = $dimensions;
        $this->timeout = $timeout;
    }

    public function embed(string $text): array
    {
        if (empty($this->apiKey)) {
            throw new Exception('Google Gemini API Key is not configured. Please set your API key in Admin Settings.');
        }

        $url = "https://generativelanguage.googleapis.com/v1beta/models/{$this->model}:embedContent?key={$this->apiKey}";

        $payload = [
            'content' => [
                'parts' => [
                    ['text' => $text],
                ],
            ],
            'outputDimensionality' => $this->dimensions,
        ];

        $response = Http::timeout($this->timeout)
            ->withHeaders(['Content-Type' => 'application/json'])
            ->post($url, $payload);

        if (! $response->successful()) {
            $error = $response->json('error.message') ?? $response->body();
            Log::error("Gemini embedding generation failed: {$error}");
            throw new Exception("Gemini API error: {$error}");
        }

        $values = $response->json('embedding.values') ?? [];

        // If returned vector length does not match dimensions, slice or pad
        if (count($values) > $this->dimensions) {
            $values = array_slice($values, 0, $this->dimensions);
        }

        return $values;
    }

    public function embedBatch(array $texts): array
    {
        $vectors = [];
        foreach ($texts as $text) {
            $vectors[] = $this->embed($text);
        }
        return $vectors;
    }

    public function getDimensions(): int
    {
        return $this->dimensions;
    }

    public function getModelName(): string
    {
        return "gemini:{$this->model}";
    }
}

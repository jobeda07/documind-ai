<?php

namespace App\Services\Ai\Ollama;

use App\Services\Ai\Contracts\EmbeddingProviderInterface;
use Exception;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class OllamaEmbeddingProvider implements EmbeddingProviderInterface
{
    protected string $baseUrl;
    protected string $model;
    protected int $dimensions;
    protected int $timeout;

    public function __construct(?string $baseUrl = null, ?string $model = null, ?int $dimensions = null, ?int $timeout = null)
    {
        $this->baseUrl = rtrim($baseUrl ?? config('ai.ollama.base_url', 'http://127.0.0.1:11434'), '/');
        $this->model = $model ?? config('ai.embedding_model', 'all-minilm');
        $this->dimensions = $dimensions ?? (int) config('ai.embedding_dimensions', 384);
        $this->timeout = $timeout ?? (int) config('ai.ollama.timeout', 60);
    }

    public function embed(string $text): array
    {
        $response = Http::timeout($this->timeout)
            ->post("{$this->baseUrl}/api/embeddings", [
                'model' => $this->model,
                'prompt' => $text,
            ]);

        if (! $response->successful()) {
            $error = $response->json('error') ?? $response->body();
            Log::error("Ollama embeddings failed: {$error}");
            throw new Exception("Ollama embedding generation failed: {$error}");
        }

        $embedding = $response->json('embedding');

        if (! is_array($embedding) || count($embedding) === 0) {
            throw new Exception("Ollama returned an empty embedding vector for model {$this->model}");
        }

        return $embedding;
    }

    public function embedBatch(array $texts): array
    {
        $embeddings = [];
        foreach ($texts as $text) {
            $embeddings[] = $this->embed($text);
        }

        return $embeddings;
    }

    public function getDimensions(): int
    {
        return $this->dimensions;
    }

    public function getModelName(): string
    {
        return $this->model;
    }
}

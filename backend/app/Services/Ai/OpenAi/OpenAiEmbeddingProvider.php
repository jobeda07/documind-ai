<?php

namespace App\Services\Ai\OpenAi;

use App\Services\Ai\Contracts\EmbeddingProviderInterface;
use Exception;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class OpenAiEmbeddingProvider implements EmbeddingProviderInterface
{
    protected string $apiKey;
    protected string $model;
    protected int $dimensions;
    protected int $timeout;

    public function __construct(
        string $apiKey,
        string $model = 'text-embedding-3-small',
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
        $batch = $this->embedBatch([$text]);
        return $batch[0] ?? [];
    }

    public function embedBatch(array $texts): array
    {
        if (empty($this->apiKey)) {
            throw new Exception('OpenAI API Key is not configured. Please set your API key in Admin Settings.');
        }

        $payload = [
            'model' => $this->model,
            'input' => array_values($texts),
        ];

        // text-embedding-3-* models support specifying dimensions directly (e.g. 384)
        if (str_starts_with($this->model, 'text-embedding-3')) {
            $payload['dimensions'] = $this->dimensions;
        }

        $response = Http::withToken($this->apiKey)
            ->timeout($this->timeout)
            ->post('https://api.openai.com/v1/embeddings', $payload);

        if (! $response->successful()) {
            $error = $response->json('error.message') ?? $response->body();
            Log::error("OpenAI embedding generation failed: {$error}");
            throw new Exception("OpenAI API error: {$error}");
        }

        $data = $response->json('data') ?? [];
        $vectors = [];

        foreach ($data as $item) {
            $vectors[] = $item['embedding'];
        }

        return $vectors;
    }

    public function getDimensions(): int
    {
        return $this->dimensions;
    }

    public function getModelName(): string
    {
        return "openai:{$this->model}";
    }
}

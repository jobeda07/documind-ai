<?php

namespace App\Services\Ai\OpenAi;

use App\Services\Ai\Contracts\LlmProviderInterface;
use Exception;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class OpenAiLlmProvider implements LlmProviderInterface
{
    protected string $apiKey;
    protected string $model;
    protected float $temperature;
    protected int $maxTokens;
    protected int $timeout;

    public function __construct(
        string $apiKey,
        string $model = 'gpt-4o-mini',
        float $temperature = 0.3,
        int $maxTokens = 1024,
        int $timeout = 60
    ) {
        $this->apiKey = $apiKey;
        $this->model = $model;
        $this->temperature = $temperature;
        $this->maxTokens = $maxTokens;
        $this->timeout = $timeout;
    }

    public function generate(string $prompt, array $options = []): string
    {
        return $this->chat([
            ['role' => 'user', 'content' => $prompt],
        ], $options);
    }

    public function chat(array $messages, array $options = []): string
    {
        if (empty($this->apiKey)) {
            throw new Exception('OpenAI API Key is not configured. Please set your API key in Admin Settings.');
        }

        $payload = [
            'model' => $options['model'] ?? $this->model,
            'messages' => $messages,
            'temperature' => (float) ($options['temperature'] ?? $this->temperature),
            'max_tokens' => (int) ($options['max_tokens'] ?? $this->maxTokens),
        ];

        $response = Http::withToken($this->apiKey)
            ->timeout($this->timeout)
            ->post('https://api.openai.com/v1/chat/completions', $payload);

        if (! $response->successful()) {
            $error = $response->json('error.message') ?? $response->body();
            Log::error("OpenAI chat completion failed: {$error}");
            throw new Exception("OpenAI API error: {$error}");
        }

        return $response->json('choices.0.message.content') ?? '';
    }

    public function getModelName(): string
    {
        return "openai:{$this->model}";
    }
}

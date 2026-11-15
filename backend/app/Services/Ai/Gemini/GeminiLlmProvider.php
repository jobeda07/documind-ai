<?php

namespace App\Services\Ai\Gemini;

use App\Services\Ai\Contracts\LlmProviderInterface;
use Exception;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class GeminiLlmProvider implements LlmProviderInterface
{
    protected string $apiKey;
    protected string $model;
    protected float $temperature;
    protected int $maxTokens;
    protected int $timeout;

    public function __construct(
        string $apiKey,
        string $model = 'gemini-1.5-flash',
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
            throw new Exception('Google Gemini API Key is not configured. Please set your API key in Admin Settings.');
        }

        $model = $options['model'] ?? $this->model;
        $contents = [];

        foreach ($messages as $msg) {
            $role = ($msg['role'] === 'assistant') ? 'model' : 'user';
            $contents[] = [
                'role' => $role,
                'parts' => [
                    ['text' => $msg['content']],
                ],
            ];
        }

        $payload = [
            'contents' => $contents,
            'generationConfig' => [
                'temperature' => (float) ($options['temperature'] ?? $this->temperature),
                'maxOutputTokens' => (int) ($options['max_tokens'] ?? $this->maxTokens),
            ],
        ];

        $url = "https://generativelanguage.googleapis.com/v1beta/models/{$model}:generateContent?key={$this->apiKey}";

        $response = Http::timeout($this->timeout)
            ->withHeaders(['Content-Type' => 'application/json'])
            ->post($url, $payload);

        if (! $response->successful()) {
            $error = $response->json('error.message') ?? $response->body();
            Log::error("Gemini content generation failed: {$error}");
            throw new Exception("Gemini API error: {$error}");
        }

        $text = $response->json('candidates.0.content.parts.0.text');
        return $text ?? '';
    }

    public function getModelName(): string
    {
        return "gemini:{$this->model}";
    }
}

<?php

namespace App\Services\Ai\Claude;

use App\Services\Ai\Contracts\LlmProviderInterface;
use Exception;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class ClaudeLlmProvider implements LlmProviderInterface
{
    protected string $apiKey;
    protected string $model;
    protected float $temperature;
    protected int $maxTokens;
    protected int $timeout;

    public function __construct(
        string $apiKey,
        string $model = 'claude-3-5-haiku-20241022',
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
            throw new Exception('Anthropic Claude API Key is not configured. Please set your API key in Admin Settings.');
        }

        $systemPrompt = null;
        $formattedMessages = [];

        foreach ($messages as $msg) {
            if ($msg['role'] === 'system') {
                $systemPrompt = $msg['content'];
            } else {
                $formattedMessages[] = [
                    'role' => $msg['role'] === 'assistant' ? 'assistant' : 'user',
                    'content' => $msg['content'],
                ];
            }
        }

        // Claude requires at least one user message
        if (empty($formattedMessages)) {
            $formattedMessages[] = [
                'role' => 'user',
                'content' => 'Hello',
            ];
        }

        $payload = [
            'model' => $options['model'] ?? $this->model,
            'max_tokens' => (int) ($options['max_tokens'] ?? $this->maxTokens),
            'temperature' => (float) ($options['temperature'] ?? $this->temperature),
            'messages' => $formattedMessages,
        ];

        if ($systemPrompt) {
            $payload['system'] = $systemPrompt;
        }

        $response = Http::timeout($this->timeout)
            ->withHeaders([
                'x-api-key' => $this->apiKey,
                'anthropic-version' => '2023-06-01',
                'Content-Type' => 'application/json',
            ])
            ->post('https://api.anthropic.com/v1/messages', $payload);

        if (! $response->successful()) {
            $error = $response->json('error.message') ?? $response->body();
            Log::error("Claude chat completion failed: {$error}");
            throw new Exception("Claude API error: {$error}");
        }

        $text = $response->json('content.0.text');
        return $text ?? '';
    }

    public function getModelName(): string
    {
        return "claude:{$this->model}";
    }
}

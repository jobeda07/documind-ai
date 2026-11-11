<?php

namespace App\Services\Ai\Ollama;

use App\Services\Ai\Contracts\LlmProviderInterface;
use Exception;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class OllamaLlmProvider implements LlmProviderInterface
{
    protected string $baseUrl;
    protected string $model;
    protected int $timeout;

    public function __construct(?string $baseUrl = null, ?string $model = null, ?int $timeout = null)
    {
        $this->baseUrl = rtrim($baseUrl ?? config('ai.ollama.base_url', 'http://127.0.0.1:11434'), '/');
        $this->model = $model ?? config('ai.llm_model', 'qwen2.5:1.5b');
        $this->timeout = $timeout ?? (int) config('ai.ollama.timeout', 120);
    }

    public function generate(string $prompt, array $options = []): string
    {
        $response = Http::timeout($this->timeout)
            ->post("{$this->baseUrl}/api/generate", array_merge([
                'model' => $this->model,
                'prompt' => $prompt,
                'stream' => false,
            ], $options));

        if (! $response->successful()) {
            $error = $response->json('error') ?? $response->body();
            Log::error("Ollama generate failed: {$error}");
            throw new Exception("Ollama generation failed: {$error}");
        }

        return (string) $response->json('response');
    }

    public function chat(array $messages, array $options = []): string
    {
        $response = Http::timeout($this->timeout)
            ->post("{$this->baseUrl}/api/chat", array_merge([
                'model' => $this->model,
                'messages' => $messages,
                'stream' => false,
            ], $options));

        if (! $response->successful()) {
            $error = $response->json('error') ?? $response->body();
            Log::error("Ollama chat failed: {$error}");
            throw new Exception("Ollama chat completion failed: {$error}");
        }

        return (string) $response->json('message.content');
    }

    public function getModelName(): string
    {
        return $this->model;
    }
}

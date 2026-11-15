<?php

namespace App\Services\Ai;

use App\Models\AiSetting;
use App\Services\Ai\Claude\ClaudeLlmProvider;
use App\Services\Ai\Contracts\EmbeddingProviderInterface;
use App\Services\Ai\Contracts\LlmProviderInterface;
use App\Services\Ai\Gemini\GeminiEmbeddingProvider;
use App\Services\Ai\Gemini\GeminiLlmProvider;
use App\Services\Ai\Mock\MockEmbeddingProvider;
use App\Services\Ai\Mock\MockLlmProvider;
use App\Services\Ai\Ollama\OllamaEmbeddingProvider;
use App\Services\Ai\Ollama\OllamaLlmProvider;
use App\Services\Ai\OpenAi\OpenAiEmbeddingProvider;
use App\Services\Ai\OpenAi\OpenAiLlmProvider;
use InvalidArgumentException;

class AiManager
{
    /**
     * Resolve the active embedding provider based on runtime settings or explicit driver.
     */
    public function createEmbeddingProvider(?string $driver = null): EmbeddingProviderInterface
    {
        // In testing environment or forced mock
        if (app()->environment('testing') && config('ai.embedding_provider') === 'mock') {
            return new MockEmbeddingProvider(config('ai.embedding_dimensions', 384));
        }

        $settings = null;
        try {
            $settings = AiSetting::getSettings();
        } catch (\Throwable) {
            // DB may not be ready during initial boot
        }

        $driver = $driver ?? $settings?->active_embedding_provider ?? config('ai.embedding_provider', 'ollama');

        return match ($driver) {
            'openai' => new OpenAiEmbeddingProvider(
                apiKey: $settings?->openai_api_key ?? (string) env('OPENAI_API_KEY', ''),
                model: $settings?->openai_embedding_model ?? 'text-embedding-3-small',
                dimensions: config('ai.embedding_dimensions', 384)
            ),
            'gemini' => new GeminiEmbeddingProvider(
                apiKey: $settings?->gemini_api_key ?? (string) env('GEMINI_API_KEY', ''),
                model: $settings?->gemini_embedding_model ?? 'text-embedding-004',
                dimensions: config('ai.embedding_dimensions', 384)
            ),
            'ollama' => new OllamaEmbeddingProvider(
                baseUrl: $settings?->ollama_base_url ?? config('ai.ollama.base_url', 'http://127.0.0.1:11434'),
                model: $settings?->ollama_embedding_model ?? config('ai.embedding_model', 'all-minilm'),
                dimensions: config('ai.embedding_dimensions', 384)
            ),
            'mock' => new MockEmbeddingProvider(config('ai.embedding_dimensions', 384)),
            default => throw new InvalidArgumentException("Unsupported embedding provider [{$driver}]"),
        };
    }

    /**
     * Resolve the active LLM provider based on runtime settings or explicit driver.
     */
    public function createLlmProvider(?string $driver = null): LlmProviderInterface
    {
        // In testing environment or forced mock
        if (app()->environment('testing') && config('ai.llm_provider') === 'mock') {
            return new MockLlmProvider();
        }

        $settings = null;
        try {
            $settings = AiSetting::getSettings();
        } catch (\Throwable) {
            // DB may not be ready during initial boot
        }

        $driver = $driver ?? $settings?->active_llm_provider ?? config('ai.llm_provider', 'ollama');
        $temperature = $settings?->temperature ?? 0.3;
        $maxTokens = $settings?->max_tokens ?? 1024;

        return match ($driver) {
            'openai' => new OpenAiLlmProvider(
                apiKey: $settings?->openai_api_key ?? (string) env('OPENAI_API_KEY', ''),
                model: $settings?->openai_llm_model ?? 'gpt-4o-mini',
                temperature: $temperature,
                maxTokens: $maxTokens
            ),
            'gemini' => new GeminiLlmProvider(
                apiKey: $settings?->gemini_api_key ?? (string) env('GEMINI_API_KEY', ''),
                model: $settings?->gemini_llm_model ?? 'gemini-1.5-flash',
                temperature: $temperature,
                maxTokens: $maxTokens
            ),
            'claude' => new ClaudeLlmProvider(
                apiKey: $settings?->claude_api_key ?? (string) env('ANTHROPIC_API_KEY', ''),
                model: $settings?->claude_llm_model ?? 'claude-3-5-haiku-20241022',
                temperature: $temperature,
                maxTokens: $maxTokens
            ),
            'ollama' => new OllamaLlmProvider(
                baseUrl: $settings?->ollama_base_url ?? config('ai.ollama.base_url', 'http://127.0.0.1:11434'),
                model: $settings?->ollama_llm_model ?? config('ai.llm_model', 'qwen2.5:1.5b')
            ),
            'mock' => new MockLlmProvider(),
            default => throw new InvalidArgumentException("Unsupported LLM provider [{$driver}]"),
        };
    }
}

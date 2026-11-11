<?php

namespace App\Services\Ai;

use App\Services\Ai\Contracts\EmbeddingProviderInterface;
use App\Services\Ai\Contracts\LlmProviderInterface;
use App\Services\Ai\Mock\MockEmbeddingProvider;
use App\Services\Ai\Ollama\OllamaEmbeddingProvider;
use App\Services\Ai\Ollama\OllamaLlmProvider;
use InvalidArgumentException;

class AiManager
{
    /**
     * Resolve the active embedding provider.
     */
    public function createEmbeddingProvider(?string $driver = null): EmbeddingProviderInterface
    {
        $driver = $driver ?? config('ai.embedding_provider', 'ollama');

        return match ($driver) {
            'ollama' => new OllamaEmbeddingProvider(),
            'mock' => new MockEmbeddingProvider(config('ai.embedding_dimensions', 384)),
            default => throw new InvalidArgumentException("Unsupported embedding provider [{$driver}]"),
        };
    }

    /**
     * Resolve the active LLM provider.
     */
    public function createLlmProvider(?string $driver = null): LlmProviderInterface
    {
        $driver = $driver ?? config('ai.llm_provider', 'ollama');

        return match ($driver) {
            'ollama' => new OllamaLlmProvider(),
            default => throw new InvalidArgumentException("Unsupported LLM provider [{$driver}]"),
        };
    }
}

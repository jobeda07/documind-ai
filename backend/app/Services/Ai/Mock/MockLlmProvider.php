<?php

namespace App\Services\Ai\Mock;

use App\Services\Ai\Contracts\LlmProviderInterface;

class MockLlmProvider implements LlmProviderInterface
{
    protected string $model;
    protected ?string $fixedResponse;

    public function __construct(string $model = 'mock-llm', ?string $fixedResponse = null)
    {
        $this->model = $model;
        $this->fixedResponse = $fixedResponse;
    }

    public function setFixedResponse(?string $response): void
    {
        $this->fixedResponse = $response;
    }

    public function generate(string $prompt, array $options = []): string
    {
        if ($this->fixedResponse !== null) {
            return $this->fixedResponse;
        }

        return "This is a mock answer based on the provided documents [Source 1].";
    }

    public function chat(array $messages, array $options = []): string
    {
        if ($this->fixedResponse !== null) {
            return $this->fixedResponse;
        }

        $lastMessage = end($messages);
        $userText = $lastMessage['content'] ?? '';

        return "Mock response for: '{$userText}' [Source 1].";
    }

    public function getModelName(): string
    {
        return $this->model;
    }
}

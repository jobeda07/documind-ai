<?php

namespace App\Services\Ai\Contracts;

interface LlmProviderInterface
{
    /**
     * Generate text completion from a prompt string.
     */
    public function generate(string $prompt, array $options = []): string;

    /**
     * Chat completion with structured conversation messages.
     *
     * @param  array<array{role: string, content: string}>  $messages
     */
    public function chat(array $messages, array $options = []): string;

    /**
     * Return the model identifier.
     */
    public function getModelName(): string;
}

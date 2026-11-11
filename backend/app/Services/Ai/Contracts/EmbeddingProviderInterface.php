<?php

namespace App\Services\Ai\Contracts;

interface EmbeddingProviderInterface
{
    /**
     * Generate embedding vector for a single text chunk.
     *
     * @return array<float>
     */
    public function embed(string $text): array;

    /**
     * Generate embedding vectors for multiple text chunks in batch.
     *
     * @param  array<string>  $texts
     * @return array<array<float>>
     */
    public function embedBatch(array $texts): array;

    /**
     * Return the dimensionality of the generated vectors.
     */
    public function getDimensions(): int;

    /**
     * Return the model identifier.
     */
    public function getModelName(): string;
}

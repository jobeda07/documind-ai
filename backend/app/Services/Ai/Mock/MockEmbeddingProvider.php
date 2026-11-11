<?php

namespace App\Services\Ai\Mock;

use App\Services\Ai\Contracts\EmbeddingProviderInterface;

class MockEmbeddingProvider implements EmbeddingProviderInterface
{
    protected int $dimensions;

    public function __construct(int $dimensions = 384)
    {
        $this->dimensions = $dimensions;
    }

    public function embed(string $text): array
    {
        // Generate pseudo-random deterministic normalized float array based on md5 hash
        $hash = md5($text);
        $seed = hexdec(substr($hash, 0, 8));
        mt_srand($seed);

        $vector = [];
        $sumSquares = 0.0;

        for ($i = 0; $i < $this->dimensions; $i++) {
            $val = (mt_rand(-1000, 1000) / 1000.0);
            $vector[] = $val;
            $sumSquares += $val * $val;
        }

        // Normalize vector to unit length
        $magnitude = sqrt($sumSquares);
        if ($magnitude > 0) {
            foreach ($vector as &$v) {
                $v = round($v / $magnitude, 6);
            }
        }

        return $vector;
    }

    public function embedBatch(array $texts): array
    {
        return array_map(fn ($t) => $this->embed($t), $texts);
    }

    public function getDimensions(): int
    {
        return $this->dimensions;
    }

    public function getModelName(): string
    {
        return 'mock-embedding';
    }
}

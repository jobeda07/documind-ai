<?php

namespace Tests\Unit;

use App\Services\Ai\AiManager;
use App\Services\Ai\Contracts\EmbeddingProviderInterface;
use App\Services\Ai\Mock\MockEmbeddingProvider;
use Tests\TestCase;

class EmbeddingProviderTest extends TestCase
{
    public function test_mock_embedding_provider_returns_correct_dimensions(): void
    {
        $provider = new MockEmbeddingProvider(384);

        $vector = $provider->embed('Test chunk of document');

        $this->assertCount(384, $vector);
        $this->assertEquals(384, $provider->getDimensions());
    }

    public function test_mock_embedding_provider_is_deterministic(): void
    {
        $provider = new MockEmbeddingProvider(384);

        $vector1 = $provider->embed('Exact same query string');
        $vector2 = $provider->embed('Exact same query string');

        $this->assertEquals($vector1, $vector2);
    }

    public function test_ai_manager_resolves_mock_provider(): void
    {
        $manager = new AiManager();
        $provider = $manager->createEmbeddingProvider('mock');

        $this->assertInstanceOf(EmbeddingProviderInterface::class, $provider);
        $this->assertEquals(384, $provider->getDimensions());
    }
}

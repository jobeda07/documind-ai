<?php

namespace App\Providers;

use App\Services\Ai\AiManager;
use App\Services\Ai\Contracts\EmbeddingProviderInterface;
use App\Services\Ai\Contracts\LlmProviderInterface;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->singleton(AiManager::class, function () {
            return new AiManager();
        });

        $this->app->singleton(EmbeddingProviderInterface::class, function ($app) {
            return $app->make(AiManager::class)->createEmbeddingProvider();
        });

        $this->app->singleton(LlmProviderInterface::class, function ($app) {
            return $app->make(AiManager::class)->createLlmProvider();
        });
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        //
    }
}

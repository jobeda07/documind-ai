<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\AiSetting;
use App\Services\Ai\Claude\ClaudeLlmProvider;
use App\Services\Ai\Gemini\GeminiLlmProvider;
use App\Services\Ai\Ollama\OllamaLlmProvider;
use App\Services\Ai\OpenAi\OpenAiLlmProvider;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Throwable;

class AdminAiSettingsController extends Controller
{
    use ApiResponse;

    /**
     * Helper to mask sensitive API keys for display.
     */
    protected function maskKey(?string $key): ?string
    {
        if (empty($key)) {
            return null;
        }

        $length = strlen($key);
        if ($length <= 8) {
            return '••••••••';
        }

        return substr($key, 0, 4) . '••••••••' . substr($key, -4);
    }

    /**
     * Get current AI provider configurations and masked API keys.
     */
    public function index(): JsonResponse
    {
        $setting = AiSetting::getSettings();

        return $this->success([
            'active_llm_provider' => $setting->active_llm_provider,
            'active_embedding_provider' => $setting->active_embedding_provider,

            // OpenAI
            'openai_has_key' => ! empty($setting->openai_api_key),
            'openai_masked_key' => $this->maskKey($setting->openai_api_key),
            'openai_llm_model' => $setting->openai_llm_model,
            'openai_embedding_model' => $setting->openai_embedding_model,

            // Gemini
            'gemini_has_key' => ! empty($setting->gemini_api_key),
            'gemini_masked_key' => $this->maskKey($setting->gemini_api_key),
            'gemini_llm_model' => $setting->gemini_llm_model,
            'gemini_embedding_model' => $setting->gemini_embedding_model,

            // Claude
            'claude_has_key' => ! empty($setting->claude_api_key),
            'claude_masked_key' => $this->maskKey($setting->claude_api_key),
            'claude_llm_model' => $setting->claude_llm_model,

            // Ollama
            'ollama_base_url' => $setting->ollama_base_url,
            'ollama_llm_model' => $setting->ollama_llm_model,
            'ollama_embedding_model' => $setting->ollama_embedding_model,

            // Hyperparameters
            'temperature' => $setting->temperature,
            'max_tokens' => $setting->max_tokens,
            'updated_at' => $setting->updated_at?->toIso8601String(),
        ], 'AI settings retrieved successfully');
    }

    /**
     * Update AI provider configurations and API keys.
     */
    public function update(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'active_llm_provider' => ['required', 'string', 'in:ollama,openai,gemini,claude,mock'],
            'active_embedding_provider' => ['required', 'string', 'in:ollama,openai,gemini,mock'],

            'openai_api_key' => ['nullable', 'string'],
            'openai_llm_model' => ['nullable', 'string', 'max:60'],
            'openai_embedding_model' => ['nullable', 'string', 'max:60'],

            'gemini_api_key' => ['nullable', 'string'],
            'gemini_llm_model' => ['nullable', 'string', 'max:60'],
            'gemini_embedding_model' => ['nullable', 'string', 'max:60'],

            'claude_api_key' => ['nullable', 'string'],
            'claude_llm_model' => ['nullable', 'string', 'max:60'],

            'ollama_base_url' => ['nullable', 'string', 'max:255'],
            'ollama_llm_model' => ['nullable', 'string', 'max:60'],
            'ollama_embedding_model' => ['nullable', 'string', 'max:60'],

            'temperature' => ['nullable', 'numeric', 'between:0,1'],
            'max_tokens' => ['nullable', 'integer', 'between:128,8192'],
        ]);

        $setting = AiSetting::getSettings();

        // Update active providers
        $setting->active_llm_provider = $validated['active_llm_provider'];
        $setting->active_embedding_provider = $validated['active_embedding_provider'];

        // Update API keys only if a new valid (non-masked) key was entered
        if ($request->has('openai_api_key')) {
            $key = trim((string) $request->input('openai_api_key'));
            if (! empty($key) && ! str_contains($key, '••••')) {
                $setting->openai_api_key = $key;
            } elseif ($key === '') {
                $setting->openai_api_key = null;
            }
        }

        if ($request->has('gemini_api_key')) {
            $key = trim((string) $request->input('gemini_api_key'));
            if (! empty($key) && ! str_contains($key, '••••')) {
                $setting->gemini_api_key = $key;
            } elseif ($key === '') {
                $setting->gemini_api_key = null;
            }
        }

        if ($request->has('claude_api_key')) {
            $key = trim((string) $request->input('claude_api_key'));
            if (! empty($key) && ! str_contains($key, '••••')) {
                $setting->claude_api_key = $key;
            } elseif ($key === '') {
                $setting->claude_api_key = null;
            }
        }

        // Update Models & Base URLs
        if ($request->filled('openai_llm_model')) {
            $setting->openai_llm_model = $validated['openai_llm_model'];
        }
        if ($request->filled('openai_embedding_model')) {
            $setting->openai_embedding_model = $validated['openai_embedding_model'];
        }

        if ($request->filled('gemini_llm_model')) {
            $setting->gemini_llm_model = $validated['gemini_llm_model'];
        }
        if ($request->filled('gemini_embedding_model')) {
            $setting->gemini_embedding_model = $validated['gemini_embedding_model'];
        }

        if ($request->filled('claude_llm_model')) {
            $setting->claude_llm_model = $validated['claude_llm_model'];
        }

        if ($request->filled('ollama_base_url')) {
            $setting->ollama_base_url = rtrim($validated['ollama_base_url'], '/');
        }
        if ($request->filled('ollama_llm_model')) {
            $setting->ollama_llm_model = $validated['ollama_llm_model'];
        }
        if ($request->filled('ollama_embedding_model')) {
            $setting->ollama_embedding_model = $validated['ollama_embedding_model'];
        }

        if ($request->has('temperature')) {
            $setting->temperature = (float) $validated['temperature'];
        }
        if ($request->has('max_tokens')) {
            $setting->max_tokens = (int) $validated['max_tokens'];
        }

        $setting->updated_by = $request->user()?->id;
        $setting->save();

        AiSetting::flushSettingsCache();

        return $this->success([
            'active_llm_provider' => $setting->active_llm_provider,
            'active_embedding_provider' => $setting->active_embedding_provider,
            'openai_has_key' => ! empty($setting->openai_api_key),
            'openai_masked_key' => $this->maskKey($setting->openai_api_key),
            'gemini_has_key' => ! empty($setting->gemini_api_key),
            'gemini_masked_key' => $this->maskKey($setting->gemini_api_key),
            'claude_has_key' => ! empty($setting->claude_api_key),
            'claude_masked_key' => $this->maskKey($setting->claude_api_key),
        ], 'AI settings updated successfully');
    }

    /**
     * Test live connectivity for a selected AI provider.
     */
    public function testConnection(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'provider' => ['required', 'string', 'in:openai,gemini,claude,ollama'],
            'api_key' => ['nullable', 'string'],
            'model' => ['nullable', 'string'],
            'base_url' => ['nullable', 'string'],
        ]);

        $provider = $validated['provider'];
        $setting = AiSetting::getSettings();

        // Determine API key to test: explicit input or stored key
        $apiKey = $request->filled('api_key') && ! str_contains($request->input('api_key'), '••••')
            ? trim($request->input('api_key'))
            : null;

        $startTime = microtime(true);
        $testPrompt = 'Respond with: "DocuMind connection verified successfully."';

        try {
            switch ($provider) {
                case 'openai':
                    $key = $apiKey ?: $setting->openai_api_key ?: env('OPENAI_API_KEY');
                    if (empty($key)) {
                        return $this->error('No OpenAI API key provided or stored.', 422);
                    }
                    $model = $validated['model'] ?? $setting->openai_llm_model ?? 'gpt-4o-mini';
                    $client = new OpenAiLlmProvider($key, $model, 0.2, 50, 15);
                    $reply = $client->generate($testPrompt);
                    break;

                case 'gemini':
                    $key = $apiKey ?: $setting->gemini_api_key ?: env('GEMINI_API_KEY');
                    if (empty($key)) {
                        return $this->error('No Google Gemini API key provided or stored.', 422);
                    }
                    $model = $validated['model'] ?? $setting->gemini_llm_model ?? 'gemini-1.5-flash';
                    $client = new GeminiLlmProvider($key, $model, 0.2, 50, 15);
                    $reply = $client->generate($testPrompt);
                    break;

                case 'claude':
                    $key = $apiKey ?: $setting->claude_api_key ?: env('ANTHROPIC_API_KEY');
                    if (empty($key)) {
                        return $this->error('No Anthropic Claude API key provided or stored.', 422);
                    }
                    $model = $validated['model'] ?? $setting->claude_llm_model ?? 'claude-3-5-haiku-20241022';
                    $client = new ClaudeLlmProvider($key, $model, 0.2, 50, 15);
                    $reply = $client->generate($testPrompt);
                    break;

                case 'ollama':
                    $baseUrl = $validated['base_url'] ?? $setting->ollama_base_url ?? 'http://127.0.0.1:11434';
                    $model = $validated['model'] ?? $setting->ollama_llm_model ?? 'qwen2.5:1.5b';
                    $client = new OllamaLlmProvider($baseUrl, $model, 15);
                    $reply = $client->generate($testPrompt);
                    break;

                default:
                    return $this->error("Unsupported provider [{$provider}]", 422);
            }

            $latency = round((microtime(true) - $startTime) * 1000);

            return $this->success([
                'provider' => $provider,
                'latency_ms' => $latency,
                'reply' => trim($reply),
            ], "Connection to {$provider} succeeded in {$latency}ms!");
        } catch (Throwable $e) {
            $latency = round((microtime(true) - $startTime) * 1000);
            return $this->error("{$provider} connection failed ({$latency}ms): " . $e->getMessage(), 400);
        }
    }
}

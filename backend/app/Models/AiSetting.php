<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Cache;

class AiSetting extends Model
{
    use HasFactory;

    protected $table = 'ai_settings';

    protected $fillable = [
        'active_llm_provider',
        'active_embedding_provider',
        'openai_api_key',
        'openai_llm_model',
        'openai_embedding_model',
        'gemini_api_key',
        'gemini_llm_model',
        'gemini_embedding_model',
        'claude_api_key',
        'claude_llm_model',
        'ollama_base_url',
        'ollama_llm_model',
        'ollama_embedding_model',
        'temperature',
        'max_tokens',
        'updated_by',
    ];

    protected function casts(): array
    {
        return [
            'openai_api_key' => 'encrypted',
            'gemini_api_key' => 'encrypted',
            'claude_api_key' => 'encrypted',
            'temperature' => 'float',
            'max_tokens' => 'integer',
        ];
    }

    /**
     * Get or create the singleton instance of AI settings with cache.
     */
    public static function getSettings(): self
    {
        return Cache::remember('app_ai_settings', 60, function () {
            $setting = static::first();
            if (! $setting) {
                $setting = static::create([
                    'active_llm_provider' => config('ai.llm_provider', 'ollama'),
                    'active_embedding_provider' => config('ai.embedding_provider', 'ollama'),
                    'openai_llm_model' => 'gpt-4o-mini',
                    'openai_embedding_model' => 'text-embedding-3-small',
                    'gemini_llm_model' => 'gemini-1.5-flash',
                    'gemini_embedding_model' => 'text-embedding-004',
                    'claude_llm_model' => 'claude-3-5-haiku-20241022',
                    'ollama_base_url' => config('ai.ollama.base_url', 'http://127.0.0.1:11434'),
                    'ollama_llm_model' => config('ai.llm_model', 'qwen2.5:1.5b'),
                    'ollama_embedding_model' => config('ai.embedding_model', 'all-minilm'),
                    'temperature' => 0.3,
                    'max_tokens' => 1024,
                ]);
            }

            return $setting;
        });
    }

    /**
     * Clear cached settings.
     */
    public static function flushSettingsCache(): void
    {
        Cache::forget('app_ai_settings');
    }
}

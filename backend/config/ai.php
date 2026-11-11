<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Default AI Providers
    |--------------------------------------------------------------------------
    |
    | Supported providers: "ollama", "mock"
    |
    */
    'embedding_provider' => env('AI_EMBEDDING_PROVIDER', 'ollama'),
    'llm_provider' => env('AI_LLM_PROVIDER', 'ollama'),

    /*
    |--------------------------------------------------------------------------
    | Models & Dimensions
    |--------------------------------------------------------------------------
    */
    'embedding_model' => env('AI_EMBEDDING_MODEL', 'all-minilm'),
    'embedding_dimensions' => (int) env('AI_EMBEDDING_DIMENSIONS', 384),

    'llm_model' => env('AI_LLM_MODEL', 'qwen2.5:1.5b'),

    /*
    |--------------------------------------------------------------------------
    | Chunking Configuration
    |--------------------------------------------------------------------------
    */
    'chunk_size' => (int) env('AI_CHUNK_SIZE', 500),
    'chunk_overlap' => (int) env('AI_CHUNK_OVERLAP', 100),

    /*
    |--------------------------------------------------------------------------
    | Ollama Configuration
    |--------------------------------------------------------------------------
    */
    'ollama' => [
        'base_url' => env('OLLAMA_BASE_URL', 'http://127.0.0.1:11434'),
        'timeout' => (int) env('OLLAMA_TIMEOUT', 60),
    ],
];

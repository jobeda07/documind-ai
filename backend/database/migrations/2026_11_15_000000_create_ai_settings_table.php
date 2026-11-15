<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('ai_settings', function (Blueprint $table) {
            $table->id();

            // Active Provider Routing
            $table->string('active_llm_provider', 30)->default('ollama'); // 'ollama', 'openai', 'gemini', 'claude', 'mock'
            $table->string('active_embedding_provider', 30)->default('ollama'); // 'ollama', 'openai', 'gemini', 'mock'

            // OpenAI Config
            $table->text('openai_api_key')->nullable();
            $table->string('openai_llm_model', 60)->default('gpt-4o-mini');
            $table->string('openai_embedding_model', 60)->default('text-embedding-3-small');

            // Google Gemini Config
            $table->text('gemini_api_key')->nullable();
            $table->string('gemini_llm_model', 60)->default('gemini-1.5-flash');
            $table->string('gemini_embedding_model', 60)->default('text-embedding-004');

            // Anthropic Claude Config
            $table->text('claude_api_key')->nullable();
            $table->string('claude_llm_model', 60)->default('claude-3-5-haiku-20241022');

            // Local Ollama Config
            $table->string('ollama_base_url', 255)->default('http://127.0.0.1:11434');
            $table->string('ollama_llm_model', 60)->default('qwen2.5:1.5b');
            $table->string('ollama_embedding_model', 60)->default('all-minilm');

            // Hyperparameters
            $table->decimal('temperature', 3, 2)->default(0.30);
            $table->integer('max_tokens')->default(1024);

            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('ai_settings');
    }
};

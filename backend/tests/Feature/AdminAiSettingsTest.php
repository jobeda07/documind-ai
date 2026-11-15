<?php

namespace Tests\Feature;

use App\Models\AiSetting;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminAiSettingsTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        config(['ai.llm_provider' => 'mock']);
        config(['ai.embedding_provider' => 'mock']);
    }

    public function test_non_admin_cannot_access_ai_settings(): void
    {
        $user = User::factory()->create([
            'role' => 'user',
            'status' => 'active',
        ]);

        $response = $this->actingAs($user)->getJson('/api/v1/admin/ai-settings');
        $response->assertStatus(403);

        $updateResponse = $this->actingAs($user)->putJson('/api/v1/admin/ai-settings', [
            'active_llm_provider' => 'openai',
            'active_embedding_provider' => 'openai',
        ]);
        $updateResponse->assertStatus(403);
    }

    public function test_admin_can_retrieve_ai_settings_with_masked_keys(): void
    {
        $admin = User::factory()->admin()->create();

        AiSetting::create([
            'active_llm_provider' => 'ollama',
            'active_embedding_provider' => 'ollama',
            'openai_api_key' => 'sk-proj-1234567890abcdef12345678',
            'gemini_api_key' => 'AIzaSy1234567890abcdef12345678',
            'claude_api_key' => 'sk-ant-1234567890abcdef12345678',
        ]);

        $response = $this->actingAs($admin)->getJson('/api/v1/admin/ai-settings');

        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.active_llm_provider', 'ollama')
            ->assertJsonPath('data.openai_has_key', true)
            ->assertJsonPath('data.gemini_has_key', true)
            ->assertJsonPath('data.claude_has_key', true);

        // Verify key is masked and raw key is not exposed
        $openaiMasked = $response->json('data.openai_masked_key');
        $this->assertStringContainsString('••••••••', $openaiMasked);
        $this->assertStringNotContainsString('1234567890abcdef', $openaiMasked);
    }

    public function test_admin_can_update_ai_providers_and_keys(): void
    {
        $admin = User::factory()->admin()->create();

        $response = $this->actingAs($admin)->putJson('/api/v1/admin/ai-settings', [
            'active_llm_provider' => 'gemini',
            'active_embedding_provider' => 'openai',
            'gemini_api_key' => 'AIzaSy_NEW_GEMINI_KEY_987654321',
            'gemini_llm_model' => 'gemini-1.5-pro',
            'openai_api_key' => 'sk-proj_NEW_OPENAI_KEY_987654321',
            'openai_embedding_model' => 'text-embedding-3-small',
            'temperature' => 0.5,
            'max_tokens' => 2048,
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.active_llm_provider', 'gemini')
            ->assertJsonPath('data.active_embedding_provider', 'openai');

        $setting = AiSetting::first();
        $this->assertEquals('gemini', $setting->active_llm_provider);
        $this->assertEquals('openai', $setting->active_embedding_provider);
        $this->assertEquals('AIzaSy_NEW_GEMINI_KEY_987654321', $setting->gemini_api_key);
        $this->assertEquals('gemini-1.5-pro', $setting->gemini_llm_model);
        $this->assertEquals(0.5, $setting->temperature);
        $this->assertEquals(2048, $setting->max_tokens);
    }

    public function test_masked_key_placeholder_preserves_existing_encrypted_key(): void
    {
        $admin = User::factory()->admin()->create();

        AiSetting::create([
            'active_llm_provider' => 'ollama',
            'active_embedding_provider' => 'ollama',
            'openai_api_key' => 'sk-original-secret-key-12345678',
        ]);

        // Submit update with masked placeholder
        $response = $this->actingAs($admin)->putJson('/api/v1/admin/ai-settings', [
            'active_llm_provider' => 'openai',
            'active_embedding_provider' => 'ollama',
            'openai_api_key' => 'sk-o••••••••5678', // Masked placeholder
        ]);

        $response->assertStatus(200);

        $setting = AiSetting::first();
        // Original key must be preserved untouched
        $this->assertEquals('sk-original-secret-key-12345678', $setting->openai_api_key);
        $this->assertEquals('openai', $setting->active_llm_provider);
    }

    public function test_test_connection_fails_cleanly_when_key_is_missing(): void
    {
        $admin = User::factory()->admin()->create();

        $response = $this->actingAs($admin)->postJson('/api/v1/admin/ai-settings/test-connection', [
            'provider' => 'openai',
            'api_key' => '',
        ]);

        $response->assertStatus(422)
            ->assertJsonPath('success', false);
    }
}

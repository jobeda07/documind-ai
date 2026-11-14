<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class UserApprovalAndStatusTest extends TestCase
{
    use RefreshDatabase;

    public function test_first_registered_user_is_active_admin(): void
    {
        $response = $this->postJson('/api/v1/auth/register', [
            'name' => 'First Admin',
            'email' => 'admin@documind.local',
            'password' => 'Password123!',
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.user.role', 'admin')
            ->assertJsonPath('data.user.status', 'active')
            ->assertJsonPath('data.requires_approval', false);
    }

    public function test_subsequent_user_registration_requires_admin_approval(): void
    {
        // First user exists
        User::factory()->create(['role' => 'admin', 'status' => 'active']);

        // Second user registers
        $response = $this->postJson('/api/v1/auth/register', [
            'name' => 'Alice Member',
            'email' => 'alice@documind.local',
            'password' => 'Password123!',
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.user.role', 'user')
            ->assertJsonPath('data.user.status', 'pending')
            ->assertJsonPath('data.requires_approval', true);

        // Attempt login while pending
        $loginRes = $this->postJson('/api/v1/auth/login', [
            'email' => 'alice@documind.local',
            'password' => 'Password123!',
        ]);

        $loginRes->assertStatus(403)
            ->assertJsonPath('message', 'Your account is pending administrator approval. Please contact an admin to activate your account.');
    }

    public function test_admin_can_approve_pending_user(): void
    {
        $admin = User::factory()->create(['role' => 'admin', 'status' => 'active']);
        $pendingUser = User::factory()->create([
            'email' => 'bob@documind.local',
            'password' => bcrypt('Secret123!'),
            'role' => 'user',
            'status' => 'pending',
        ]);

        Sanctum::actingAs($admin);

        // Approve user
        $response = $this->patchJson("/api/v1/admin/users/{$pendingUser->id}/status", [
            'status' => 'active',
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.status', 'active');

        // Now Bob can log in
        $loginRes = $this->postJson('/api/v1/auth/login', [
            'email' => 'bob@documind.local',
            'password' => 'Secret123!',
        ]);

        $loginRes->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.user.status', 'active');
    }

    public function test_admin_can_deactivate_user_and_revokes_access(): void
    {
        $admin = User::factory()->create(['role' => 'admin', 'status' => 'active']);
        $user = User::factory()->create(['role' => 'user', 'status' => 'active']);

        Sanctum::actingAs($admin);

        // Deactivate user
        $response = $this->patchJson("/api/v1/admin/users/{$user->id}/status", [
            'status' => 'deactivated',
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('data.status', 'deactivated');

        // Deactivated user cannot log in
        $loginRes = $this->postJson('/api/v1/auth/login', [
            'email' => $user->email,
            'password' => 'password',
        ]);

        $loginRes->assertStatus(403)
            ->assertJsonPath('message', 'Your account has been deactivated by an administrator. Access is disabled.');
    }

    public function test_admin_cannot_deactivate_themselves(): void
    {
        $admin = User::factory()->create(['role' => 'admin', 'status' => 'active']);
        Sanctum::actingAs($admin);

        $response = $this->patchJson("/api/v1/admin/users/{$admin->id}/status", [
            'status' => 'deactivated',
        ]);

        $response->assertStatus(400)
            ->assertJsonPath('message', 'You cannot deactivate your own administrator account.');
    }

    public function test_non_admin_cannot_access_admin_user_routes(): void
    {
        $normalUser = User::factory()->create(['role' => 'user', 'status' => 'active']);
        Sanctum::actingAs($normalUser);

        $response = $this->getJson('/api/v1/admin/users');

        $response->assertStatus(403)
            ->assertJsonPath('message', 'Access denied. Administrator privileges required.');
    }
}

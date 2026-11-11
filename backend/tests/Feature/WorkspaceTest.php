<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\Workspace;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class WorkspaceTest extends TestCase
{
    use RefreshDatabase;

    public function test_unauthenticated_user_cannot_access_workspaces(): void
    {
        $response = $this->getJson('/api/v1/workspaces');

        $response->assertStatus(401);
    }

    public function test_user_can_create_workspace(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->postJson('/api/v1/workspaces', [
            'name' => 'AI Engineering',
            'description' => 'Workspace for document intelligence',
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.name', 'AI Engineering')
            ->assertJsonPath('data.slug', 'ai-engineering')
            ->assertJsonPath('data.owner.id', $user->id);

        $this->assertDatabaseHas('workspaces', [
            'name' => 'AI Engineering',
            'owner_id' => $user->id,
        ]);

        $this->assertDatabaseHas('workspace_user', [
            'user_id' => $user->id,
            'role' => 'owner',
        ]);
    }

    public function test_user_can_list_their_workspaces(): void
    {
        $user = User::factory()->create();

        $workspace1 = Workspace::create([
            'name' => 'WS 1',
            'slug' => 'ws-1',
            'owner_id' => $user->id,
        ]);
        $workspace1->users()->attach($user->id, ['role' => 'owner']);

        $otherUser = User::factory()->create();
        $otherWorkspace = Workspace::create([
            'name' => 'Other WS',
            'slug' => 'other-ws',
            'owner_id' => $otherUser->id,
        ]);
        $otherWorkspace->users()->attach($otherUser->id, ['role' => 'owner']);

        $response = $this->actingAs($user)->getJson('/api/v1/workspaces');

        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.name', 'WS 1');
    }

    public function test_user_cannot_view_or_modify_another_users_private_workspace(): void
    {
        $owner = User::factory()->create();
        $intruder = User::factory()->create();

        $workspace = Workspace::create([
            'name' => 'Secret WS',
            'slug' => 'secret-ws',
            'owner_id' => $owner->id,
        ]);
        $workspace->users()->attach($owner->id, ['role' => 'owner']);

        // View attempt
        $viewResponse = $this->actingAs($intruder)->getJson("/api/v1/workspaces/{$workspace->id}");
        $viewResponse->assertStatus(403);

        // Update attempt
        $updateResponse = $this->actingAs($intruder)->putJson("/api/v1/workspaces/{$workspace->id}", [
            'name' => 'Hacked WS',
        ]);
        $updateResponse->assertStatus(403);

        // Delete attempt
        $deleteResponse = $this->actingAs($intruder)->deleteJson("/api/v1/workspaces/{$workspace->id}");
        $deleteResponse->assertStatus(403);
    }

    public function test_workspace_owner_can_update_and_delete_workspace(): void
    {
        $owner = User::factory()->create();

        $workspace = Workspace::create([
            'name' => 'Old Name',
            'slug' => 'old-name',
            'owner_id' => $owner->id,
        ]);
        $workspace->users()->attach($owner->id, ['role' => 'owner']);

        // Update
        $updateResponse = $this->actingAs($owner)->putJson("/api/v1/workspaces/{$workspace->id}", [
            'name' => 'Updated Name',
            'description' => 'New Description',
        ]);
        $updateResponse->assertStatus(200)
            ->assertJsonPath('data.name', 'Updated Name');

        // Delete
        $deleteResponse = $this->actingAs($owner)->deleteJson("/api/v1/workspaces/{$workspace->id}");
        $deleteResponse->assertStatus(200)
            ->assertJsonPath('success', true);

        $this->assertDatabaseMissing('workspaces', [
            'id' => $workspace->id,
        ]);
    }
}

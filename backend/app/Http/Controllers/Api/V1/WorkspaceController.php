<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Workspace;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Str;

class WorkspaceController extends Controller
{
    use ApiResponse;

    /**
     * List all workspaces the user has access to.
     */
    public function index(Request $request): JsonResponse
    {
        $workspaces = $request->user()->workspaces()->with('owner:id,name,email')->get();

        return $this->success($workspaces, 'Workspaces retrieved successfully');
    }

    /**
     * Create a new workspace and assign current user as owner.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:1000'],
        ]);

        return DB::transaction(function () use ($validated, $request) {
            $user = $request->user();

            $slugBase = Str::slug($validated['name']);
            if (empty($slugBase)) {
                $slugBase = 'workspace';
            }
            $slug = $slugBase;
            $counter = 1;
            while (Workspace::where('slug', $slug)->exists()) {
                $slug = "{$slugBase}-{$counter}";
                $counter++;
            }

            $workspace = Workspace::create([
                'name' => $validated['name'],
                'slug' => $slug,
                'description' => $validated['description'] ?? null,
                'owner_id' => $user->id,
            ]);

            $workspace->users()->attach($user->id, ['role' => 'owner']);

            return $this->success($workspace->load('owner:id,name,email'), 'Workspace created successfully', 201);
        });
    }

    /**
     * Display the specified workspace.
     */
    public function show(Request $request, Workspace $workspace): JsonResponse
    {
        Gate::authorize('view', $workspace);

        $workspace->load(['owner:id,name,email', 'users:id,name,email']);

        return $this->success($workspace, 'Workspace retrieved successfully');
    }

    /**
     * Update workspace details.
     */
    public function update(Request $request, Workspace $workspace): JsonResponse
    {
        Gate::authorize('update', $workspace);

        $validated = $request->validate([
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:1000'],
        ]);

        $workspace->update($validated);

        return $this->success($workspace, 'Workspace updated successfully');
    }

    /**
     * Delete a workspace.
     */
    public function destroy(Request $request, Workspace $workspace): JsonResponse
    {
        Gate::authorize('delete', $workspace);

        $workspace->delete();

        return $this->success(null, 'Workspace deleted successfully');
    }

    /**
     * Get real-time statistics for the workspace.
     */
    public function stats(Request $request, Workspace $workspace): JsonResponse
    {
        Gate::authorize('view', $workspace);

        $totalDocs = $workspace->documents()->count();
        $processedDocs = $workspace->documents()->where('status', 'completed')->count();
        $storageBytes = (int) $workspace->documents()->sum('file_size');
        $storageMb = round($storageBytes / (1024 * 1024), 2);

        $recentDocs = $workspace->documents()
            ->latest()
            ->take(5)
            ->get(['id', 'uuid', 'title', 'original_filename', 'mime_type', 'file_size', 'status', 'created_at']);

        return $this->success([
            'total_documents' => $totalDocs,
            'processed_documents' => $processedDocs,
            'total_chats' => 0,
            'storage_used_bytes' => $storageBytes,
            'storage_used_mb' => $storageMb,
            'recent_documents' => $recentDocs,
        ], 'Workspace statistics retrieved successfully');
    }
}

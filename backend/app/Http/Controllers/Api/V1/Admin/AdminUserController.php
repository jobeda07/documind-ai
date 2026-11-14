<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminUserController extends Controller
{
    use ApiResponse;

    /**
     * List all users with workspace counts and status.
     */
    public function index(Request $request): JsonResponse
    {
        $users = User::query()
            ->withCount('workspaces')
            ->orderBy('id', 'asc')
            ->get(['id', 'name', 'email', 'role', 'status', 'created_at']);

        return $this->success($users, 'User list retrieved successfully');
    }

    /**
     * Update user status (approve, activate, deactivate).
     */
    public function updateStatus(Request $request, User $user): JsonResponse
    {
        $validated = $request->validate([
            'status' => ['required', 'string', 'in:active,deactivated,pending'],
        ]);

        // Prevent self-deactivation by admin
        if ($user->id === $request->user()->id && $validated['status'] !== 'active') {
            return $this->error('You cannot deactivate your own administrator account.', 400);
        }

        $user->update(['status' => $validated['status']]);

        // If deactivated, revoke all active tokens for this user immediately
        if ($validated['status'] === 'deactivated') {
            $user->tokens()->delete();
        }

        return $this->success([
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'role' => $user->role,
            'status' => $user->status,
        ], "User status updated to '{$validated['status']}' successfully");
    }

    /**
     * Update user role (promote to admin, demote to user).
     */
    public function updateRole(Request $request, User $user): JsonResponse
    {
        $validated = $request->validate([
            'role' => ['required', 'string', 'in:admin,user'],
        ]);

        if ($user->id === $request->user()->id && $validated['role'] !== 'admin') {
            return $this->error('You cannot remove administrator role from yourself.', 400);
        }

        $user->update(['role' => $validated['role']]);

        return $this->success([
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'role' => $user->role,
            'status' => $user->status,
        ], "User role updated to '{$validated['role']}' successfully");
    }
}

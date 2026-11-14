<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Workspace;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\Rules\Password;

class AuthController extends Controller
{
    use ApiResponse;

    /**
     * Register a new user. First user becomes active admin; subsequent users require admin approval.
     */
    public function register(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'string', Password::defaults()],
        ]);

        return DB::transaction(function () use ($validated) {
            $isFirstUser = User::count() === 0;
            $role = $isFirstUser ? 'admin' : 'user';
            $status = $isFirstUser ? 'active' : 'pending';

            $user = User::create([
                'name' => $validated['name'],
                'email' => $validated['email'],
                'password' => Hash::make($validated['password']),
                'role' => $role,
                'status' => $status,
            ]);

            // Create default personal workspace
            $slugBase = Str::slug($user->name . '-workspace');
            $slug = $slugBase;
            $counter = 1;
            while (Workspace::where('slug', $slug)->exists()) {
                $slug = "{$slugBase}-{$counter}";
                $counter++;
            }

            $workspace = Workspace::create([
                'name' => "{$user->name}'s Workspace",
                'slug' => $slug,
                'description' => 'Default personal workspace',
                'owner_id' => $user->id,
            ]);

            $workspace->users()->attach($user->id, ['role' => 'owner']);

            // If account requires admin approval, do not issue an auth token
            if ($status === 'pending') {
                return $this->success([
                    'user' => [
                        'id' => $user->id,
                        'name' => $user->name,
                        'email' => $user->email,
                        'role' => $user->role,
                        'status' => $user->status,
                    ],
                    'requires_approval' => true,
                ], 'Registration successful! Your account is pending administrator approval before you can log in.', 201);
            }

            // First user is immediately active
            $token = $user->createToken('documind_auth')->plainTextToken;

            return $this->success([
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'role' => $user->role,
                    'status' => $user->status,
                ],
                'token' => $token,
                'default_workspace' => $workspace,
                'requires_approval' => false,
            ], 'User registered successfully', 201);
        });
    }

    /**
     * Authenticate user and issue Sanctum token. Rejects pending or deactivated accounts.
     */
    public function login(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email' => ['required', 'string', 'email'],
            'password' => ['required', 'string'],
        ]);

        $user = User::where('email', $validated['email'])->first();

        if (! $user || ! Hash::check($validated['password'], $user->password)) {
            return $this->error('Invalid credentials provided', 401);
        }

        // Check if account is pending approval
        if ($user->isPending()) {
            return $this->error('Your account is pending administrator approval. Please contact an admin to activate your account.', 403);
        }

        // Check if account has been deactivated
        if ($user->isDeactivated()) {
            return $this->error('Your account has been deactivated by an administrator. Access is disabled.', 403);
        }

        $token = $user->createToken('documind_auth')->plainTextToken;

        $workspaces = $user->workspaces()->get();

        return $this->success([
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
                'status' => $user->status,
            ],
            'token' => $token,
            'workspaces' => $workspaces,
        ], 'Login successful');
    }

    /**
     * Terminate the active Sanctum token.
     */
    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();

        return $this->success(null, 'Logged out successfully');
    }

    /**
     * Return authenticated user profile and workspaces.
     */
    public function me(Request $request): JsonResponse
    {
        $user = $request->user();

        return $this->success([
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
                'status' => $user->status,
            ],
            'workspaces' => $user->workspaces()->get(),
        ], 'Profile retrieved successfully');
    }
}

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
     * Register a new user and generate a default workspace.
     */
    public function register(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'string', Password::defaults()],
        ]);

        return DB::transaction(function () use ($validated) {
            $user = User::create([
                'name' => $validated['name'],
                'email' => $validated['email'],
                'password' => Hash::make($validated['password']),
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

            $token = $user->createToken('documind_auth')->plainTextToken;

            return $this->success([
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                ],
                'token' => $token,
                'default_workspace' => $workspace,
            ], 'User registered successfully', 201);
        });
    }

    /**
     * Authenticate user and issue Sanctum token.
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

        $token = $user->createToken('documind_auth')->plainTextToken;

        $workspaces = $user->workspaces()->get();

        return $this->success([
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
            ],
            'token' => $token,
            'workspaces' => $workspaces,
        ], 'Login successful');
    }

    /**
     * Invalidate current user token.
     */
    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();

        return $this->success(null, 'Logged out successfully');
    }

    /**
     * Get authenticated user profile with workspaces.
     */
    public function me(Request $request): JsonResponse
    {
        $user = $request->user();
        $workspaces = $user->workspaces()->get();

        return $this->success([
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
            ],
            'workspaces' => $workspaces,
        ], 'Profile retrieved successfully');
    }
}

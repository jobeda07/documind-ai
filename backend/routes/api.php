<?php

use App\Http\Controllers\Api\V1\Admin\AdminUserController;
use App\Http\Controllers\Api\V1\AnalyticsController;
use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\ChatController;
use App\Http\Controllers\Api\V1\DocumentController;
use App\Http\Controllers\Api\V1\SearchController;
use App\Http\Controllers\Api\V1\WorkspaceController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function () {
    // Public authentication routes
    Route::prefix('auth')->group(function () {
        Route::post('register', [AuthController::class, 'register']);
        Route::post('login', [AuthController::class, 'login']);
    });

    // Authenticated protected routes (Active users only)
    Route::middleware(['auth:sanctum', 'user.active'])->group(function () {
        Route::prefix('auth')->group(function () {
            Route::post('logout', [AuthController::class, 'logout']);
            Route::get('me', [AuthController::class, 'me']);
        });

        // Administrator User Management
        Route::middleware('user.admin')->prefix('admin')->group(function () {
            Route::get('users', [AdminUserController::class, 'index']);
            Route::patch('users/{user}/status', [AdminUserController::class, 'updateStatus']);
            Route::patch('users/{user}/role', [AdminUserController::class, 'updateRole']);
        });

        Route::apiResource('workspaces', WorkspaceController::class);
        Route::get('workspaces/{workspace}/stats', [WorkspaceController::class, 'stats']);

        // Document Management under a workspace
        Route::prefix('workspaces/{workspace}')->group(function () {
            Route::get('documents', [DocumentController::class, 'index']);
            Route::post('documents', [DocumentController::class, 'store']);
            Route::get('documents/{document}', [DocumentController::class, 'show']);
            Route::get('documents/{document}/chunks', [DocumentController::class, 'chunks']);
            Route::post('documents/{document}/reprocess', [DocumentController::class, 'reprocess']);
            Route::delete('documents/{document}', [DocumentController::class, 'destroy']);

            // Chat conversations & RAG messaging
            Route::get('conversations', [ChatController::class, 'index']);
            Route::post('conversations', [ChatController::class, 'store']);
            Route::get('conversations/{conversation}', [ChatController::class, 'show']);
            Route::get('conversations/{conversation}/export', [ChatController::class, 'export']);
            Route::post('conversations/{conversation}/messages', [ChatController::class, 'sendMessage']);
            Route::delete('conversations/{conversation}', [ChatController::class, 'destroy']);

            // Search & Analytics
            Route::get('search', [SearchController::class, 'search']);
            Route::get('analytics', [AnalyticsController::class, 'overview']);
        });
    });
});

<?php

use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\DocumentController;
use App\Http\Controllers\Api\V1\WorkspaceController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function () {
    // Public authentication routes
    Route::prefix('auth')->group(function () {
        Route::post('register', [AuthController::class, 'register']);
        Route::post('login', [AuthController::class, 'login']);
    });

    // Authenticated protected routes
    Route::middleware('auth:sanctum')->group(function () {
        Route::prefix('auth')->group(function () {
            Route::post('logout', [AuthController::class, 'logout']);
            Route::get('me', [AuthController::class, 'me']);
        });

        Route::apiResource('workspaces', WorkspaceController::class);
        Route::get('workspaces/{workspace}/stats', [WorkspaceController::class, 'stats']);

        // Document Management under a workspace
        Route::prefix('workspaces/{workspace}')->group(function () {
            Route::get('documents', [DocumentController::class, 'index']);
            Route::post('documents', [DocumentController::class, 'store']);
            Route::get('documents/{document}', [DocumentController::class, 'show']);
            Route::post('documents/{document}/reprocess', [DocumentController::class, 'reprocess']);
            Route::delete('documents/{document}', [DocumentController::class, 'destroy']);
        });
    });
});

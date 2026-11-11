<?php

use App\Http\Controllers\Api\V1\AuthController;
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
    });
});

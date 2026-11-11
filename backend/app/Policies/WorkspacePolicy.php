<?php

namespace App\Policies;

use App\Models\User;
use App\Models\Workspace;

class WorkspacePolicy
{
    /**
     * Determine whether the user can view the workspace.
     */
    public function view(User $user, Workspace $workspace): bool
    {
        return $workspace->owner_id === $user->id
            || $workspace->users()->where('users.id', $user->id)->exists();
    }

    /**
     * Determine whether the user can update the workspace.
     */
    public function update(User $user, Workspace $workspace): bool
    {
        if ($workspace->owner_id === $user->id) {
            return true;
        }

        $membership = $workspace->users()->where('users.id', $user->id)->first();

        return $membership && in_array($membership->pivot->role, ['owner', 'admin'], true);
    }

    /**
     * Determine whether the user can delete the workspace.
     */
    public function delete(User $user, Workspace $workspace): bool
    {
        return $workspace->owner_id === $user->id;
    }
}

<?php

namespace App\Policies;

use App\Models\Document;
use App\Models\User;
use App\Models\Workspace;

class DocumentPolicy
{
    /**
     * Determine whether the user can view documents in the workspace.
     */
    public function viewAny(User $user, Workspace $workspace): bool
    {
        return $workspace->owner_id === $user->id
            || $workspace->users()->where('users.id', $user->id)->exists();
    }

    /**
     * Determine whether the user can view the document.
     */
    public function view(User $user, Document $document): bool
    {
        return $this->viewAny($user, $document->workspace);
    }

    /**
     * Determine whether the user can create documents in the workspace.
     */
    public function create(User $user, Workspace $workspace): bool
    {
        return $workspace->owner_id === $user->id
            || $workspace->users()->where('users.id', $user->id)->exists();
    }

    /**
     * Determine whether the user can delete the document.
     */
    public function delete(User $user, Document $document): bool
    {
        return $document->user_id === $user->id
            || $document->workspace->owner_id === $user->id;
    }
}

<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Jobs\ProcessDocumentJob;
use App\Models\Document;
use App\Models\Workspace;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class DocumentController extends Controller
{
    use ApiResponse;

    /**
     * List documents in a workspace.
     */
    public function index(Request $request, Workspace $workspace): JsonResponse
    {
        Gate::authorize('viewAny', [Document::class, $workspace]);

        $query = $workspace->documents()->with('user:id,name,email');

        if ($request->has('status') && in_array($request->query('status'), ['pending', 'processing', 'completed', 'failed'], true)) {
            $query->where('status', $request->query('status'));
        }

        if ($request->has('search') && ! empty($request->query('search'))) {
            $search = $request->query('search');
            $query->where(function ($q) use ($search) {
                $q->where('title', 'ilike', "%{$search}%")
                  ->orWhere('original_filename', 'ilike', "%{$search}%");
            });
        }

        $documents = $query->latest()->paginate($request->query('per_page', 15));

        return $this->success($documents, 'Documents retrieved successfully');
    }

    /**
     * Upload and store a new document in the workspace.
     */
    public function store(Request $request, Workspace $workspace): JsonResponse
    {
        Gate::authorize('create', [Document::class, $workspace]);

        $request->validate([
            'file' => [
                'required',
                'file',
                'mimes:pdf,docx,txt',
                'max:20480', // 20MB limit
            ],
            'title' => ['nullable', 'string', 'max:255'],
        ]);

        $file = $request->file('file');
        $originalFilename = $file->getClientOriginalName();
        $title = $request->input('title') ?: pathinfo($originalFilename, PATHINFO_FILENAME);
        $mimeType = $file->getMimeType() ?: 'application/octet-stream';
        $fileSize = $file->getSize();
        $fileHash = hash_file('sha256', $file->getRealPath());

        $uuid = (string) Str::uuid();
        $extension = $file->getClientOriginalExtension() ?: 'bin';
        $fileName = "{$uuid}.{$extension}";
        $relativeDir = "documents/{$workspace->id}";

        // Secure file storage on private local disk
        $path = $file->storeAs($relativeDir, $fileName, 'local');

        $document = Document::create([
            'uuid' => $uuid,
            'workspace_id' => $workspace->id,
            'user_id' => $request->user()->id,
            'title' => $title,
            'original_filename' => $originalFilename,
            'file_path' => $path,
            'mime_type' => $mimeType,
            'file_size' => $fileSize,
            'file_hash' => $fileHash,
            'status' => 'pending',
            'metadata' => [
                'uploaded_ip' => $request->ip(),
                'client_mime' => $file->getClientMimeType(),
            ],
        ]);

        // Dispatch background processing job
        ProcessDocumentJob::dispatch($document);

        return $this->success(
            $document->load('user:id,name,email'),
            'Document uploaded successfully and queued for processing',
            201
        );
    }

    /**
     * Show document details.
     */
    public function show(Request $request, Workspace $workspace, Document $document): JsonResponse
    {
        $this->ensureDocumentBelongsToWorkspace($document, $workspace);
        Gate::authorize('view', $document);

        return $this->success($document->load('user:id,name,email'), 'Document retrieved successfully');
    }

    /**
     * Reprocess a document.
     */
    public function reprocess(Request $request, Workspace $workspace, Document $document): JsonResponse
    {
        $this->ensureDocumentBelongsToWorkspace($document, $workspace);
        Gate::authorize('view', $document);

        $document->update([
            'status' => 'pending',
            'error_message' => null,
        ]);

        ProcessDocumentJob::dispatch($document);

        return $this->success($document, 'Document re-queued for processing');
    }

    /**
     * Delete a document.
     */
    public function destroy(Request $request, Workspace $workspace, Document $document): JsonResponse
    {
        $this->ensureDocumentBelongsToWorkspace($document, $workspace);
        Gate::authorize('delete', $document);

        // Delete underlying file if present
        if (Storage::disk('local')->exists($document->file_path)) {
            Storage::disk('local')->delete($document->file_path);
        }

        $document->delete();

        return $this->success(null, 'Document deleted successfully');
    }

    /**
     * Ensure the document belongs to the specified workspace.
     */
    protected function ensureDocumentBelongsToWorkspace(Document $document, Workspace $workspace): void
    {
        if ($document->workspace_id !== $workspace->id) {
            abort(404, 'Document not found in this workspace');
        }
    }
}

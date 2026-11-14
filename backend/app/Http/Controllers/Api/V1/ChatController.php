<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Conversation;
use App\Models\Workspace;
use App\Services\Rag\RagService;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Str;

class ChatController extends Controller
{
    use ApiResponse;

    /**
     * List all conversations in the workspace for the authenticated user.
     */
    public function index(Request $request, Workspace $workspace): JsonResponse
    {
        Gate::authorize('view', $workspace);

        $conversations = $workspace->conversations()
            ->where('user_id', $request->user()->id)
            ->withCount('messages')
            ->with(['messages' => function ($q) {
                $q->latest()->limit(1);
            }])
            ->orderBy('updated_at', 'desc')
            ->get();

        return $this->success($conversations, 'Conversations retrieved successfully');
    }

    /**
     * Create a new conversation.
     */
    public function store(Request $request, Workspace $workspace): JsonResponse
    {
        Gate::authorize('view', $workspace);

        $validated = $request->validate([
            'title' => ['nullable', 'string', 'max:150'],
        ]);

        $conversation = $workspace->conversations()->create([
            'user_id' => $request->user()->id,
            'title' => $validated['title'] ?? 'New Conversation',
        ]);

        return $this->success($conversation, 'Conversation created successfully', 201);
    }

    /**
     * Show a conversation with all messages and citations.
     */
    public function show(Request $request, Workspace $workspace, Conversation $conversation): JsonResponse
    {
        Gate::authorize('view', $workspace);

        if ($conversation->workspace_id !== $workspace->id) {
            return $this->error('Conversation not found in this workspace', 404);
        }

        $conversation->load('messages');

        return $this->success($conversation, 'Conversation retrieved successfully');
    }

    /**
     * Post a user message and receive an AI RAG grounded response with citations.
     */
    public function sendMessage(
        Request $request,
        Workspace $workspace,
        Conversation $conversation,
        RagService $rag
    ): JsonResponse {
        Gate::authorize('view', $workspace);

        if ($conversation->workspace_id !== $workspace->id) {
            return $this->error('Conversation not found in this workspace', 404);
        }

        $validated = $request->validate([
            'content' => ['required', 'string', 'max:3000'],
        ]);

        $userContent = trim($validated['content']);

        // 1. Create user message
        $userMessage = $conversation->messages()->create([
            'role' => 'user',
            'content' => $userContent,
        ]);

        // Auto-update conversation title if still default
        if ($conversation->title === 'New Conversation') {
            $title = Str::limit($userContent, 45, '...');
            $conversation->update(['title' => $title]);
        }

        // 2. Fetch recent conversation history
        $history = $conversation->messages()
            ->where('id', '!=', $userMessage->id)
            ->latest()
            ->take(6)
            ->get()
            ->reverse()
            ->map(fn ($m) => ['role' => $m->role, 'content' => $m->content])
            ->values()
            ->all();

        // 3. Execute RAG service to query documents and LLM
        $ragResult = $rag->answer($workspace->id, $userContent, $history);

        // 4. Save AI response
        $assistantMessage = $conversation->messages()->create([
            'role' => 'assistant',
            'content' => $ragResult['answer'],
            'citations' => $ragResult['citations'],
            'metadata' => [
                'model' => $ragResult['model'],
                'has_grounding' => $ragResult['has_grounding'],
                'chunks_retrieved' => $ragResult['chunks_retrieved'],
            ],
        ]);

        $conversation->touch();

        return $this->success([
            'user_message' => $userMessage,
            'assistant_message' => $assistantMessage,
        ], 'Message processed successfully');
    }

    /**
     * Export conversation transcript as Markdown or JSON.
     */
    public function export(Request $request, Workspace $workspace, Conversation $conversation): JsonResponse|\Illuminate\Http\Response
    {
        Gate::authorize('view', $workspace);

        if ($conversation->workspace_id !== $workspace->id) {
            return $this->error('Conversation not found in this workspace', 404);
        }

        $conversation->load('messages');
        $format = $request->query('format', 'markdown');

        if ($format === 'json') {
            return response()->json([
                'conversation' => [
                    'id' => $conversation->id,
                    'title' => $conversation->title,
                    'workspace' => $workspace->name,
                    'created_at' => $conversation->created_at->toIso8601String(),
                ],
                'messages' => $conversation->messages,
            ], 200, [
                'Content-Disposition' => "attachment; filename=\"chat-{$conversation->id}.json\"",
            ]);
        }

        // Markdown format
        $md = "# Chat: {$conversation->title}\n";
        $md .= "**Workspace:** {$workspace->name}  \n";
        $md .= "**Date:** {$conversation->created_at->toFormattedDateString()}  \n\n---\n\n";

        foreach ($conversation->messages as $msg) {
            $sender = $msg->role === 'user' ? 'User' : 'DocuMind AI';
            $md .= "### {$sender} ({$msg->created_at->format('H:i')})\n\n";
            $md .= "{$msg->content}\n\n";

            if (! empty($msg->citations)) {
                $md .= "#### Source Citations:\n";
                foreach ($msg->citations as $cit) {
                    $md .= "- **{$cit['label']}**: *{$cit['filename']}* (Page {$cit['page_number']}) - {$cit['content_snippet']}\n";
                }
                $md .= "\n";
            }
            $md .= "---\n\n";
        }

        return response($md, 200, [
            'Content-Type' => 'text/markdown; charset=utf-8',
            'Content-Disposition' => "attachment; filename=\"chat-{$conversation->id}.md\"",
        ]);
    }

    /**
     * Delete a conversation.
     */
    public function destroy(Request $request, Workspace $workspace, Conversation $conversation): JsonResponse
    {
        Gate::authorize('view', $workspace);

        if ($conversation->workspace_id !== $workspace->id) {
            return $this->error('Conversation not found in this workspace', 404);
        }

        $conversation->delete();

        return $this->success(null, 'Conversation deleted successfully');
    }
}

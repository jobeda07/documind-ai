<?php

namespace App\Services\Rag;

use App\Services\Ai\Contracts\LlmProviderInterface;
use Illuminate\Support\Facades\Log;

class RagService
{
    public function __construct(
        protected DocumentRetriever $retriever,
        protected ContextBuilder $contextBuilder,
        protected LlmProviderInterface $llmProvider
    ) {
    }

    /**
     * Answer a user question with grounded citations from workspace documents.
     *
     * @param  int  $workspaceId
     * @param  string  $question
     * @param  array<array{role: string, content: string}>  $history
     * @param  array{
     *     top_k?: int,
     *     min_similarity?: float,
     *     temperature?: float
     * }  $options
     * @return array{
     *     question: string,
     *     answer: string,
     *     citations: array<int, mixed>,
     *     chunks_retrieved: int,
     *     has_grounding: bool,
     *     model: string
     * }
     */
    public function answer(
        int $workspaceId,
        string $question,
        array $history = [],
        array $options = []
    ): array {
        $topK = $options['top_k'] ?? 4;
        $minSimilarity = $options['min_similarity'] ?? 0.25;

        // 1. Retrieve relevant chunks using vector similarity
        $chunks = $this->retriever->retrieve(
            $workspaceId,
            $question,
            $topK,
            $minSimilarity
        );

        Log::info("RAG: Retrieved " . $chunks->count() . " chunks for workspace {$workspaceId} on question: '{$question}'");

        // 2. If no chunks found, return polite ungrounded response
        if ($chunks->isEmpty()) {
            return [
                'question' => $question,
                'answer' => "I couldn't find any relevant information in the uploaded workspace documents to answer your question. Please ensure documents covering this topic are uploaded and processed.",
                'citations' => [],
                'chunks_retrieved' => 0,
                'has_grounding' => false,
                'model' => $this->llmProvider->getModelName(),
            ];
        }

        // 3. Build structured citation context
        $contextData = $this->contextBuilder->build($chunks);

        // 4. Construct messages payload with strict grounding system prompt
        $systemPrompt = <<<PROMPT
You are DocuMind AI, an enterprise-grade document intelligence assistant.
Your task is to answer the user's question accurately, clearly, and concisely based strictly on the provided Context Sources.

Rules:
1. Ground your answer EXCLUSIVELY in the provided Context Sources. Do not guess, assume, or invent details not present in the sources.
2. For every fact, statement, or claim, cite the corresponding source in brackets, e.g. [Source 1] or [Source 2].
3. If the sources do not contain sufficient information to fully answer the question, clearly state what information is available and mention that the documents do not cover the rest.
4. Respond in the same language as the user's inquiry (e.g. English, Bengali).

Context Sources:
{$contextData['context']}
PROMPT;

        $messages = [
            ['role' => 'system', 'content' => $systemPrompt],
        ];

        // Append recent conversational history (up to last 6 messages)
        $recentHistory = array_slice($history, -6);
        foreach ($recentHistory as $msg) {
            if (isset($msg['role'], $msg['content'])) {
                $messages[] = [
                    'role' => $msg['role'] === 'assistant' ? 'assistant' : 'user',
                    'content' => $msg['content'],
                ];
            }
        }

        // Append the current question
        $messages[] = [
            'role' => 'user',
            'content' => $question,
        ];

        // 5. Generate completion via LLM
        $answerText = $this->llmProvider->chat($messages, [
            'options' => [
                'temperature' => $options['temperature'] ?? 0.3,
            ],
        ]);

        return [
            'question' => $question,
            'answer' => trim($answerText),
            'citations' => $contextData['citations'],
            'chunks_retrieved' => $chunks->count(),
            'has_grounding' => true,
            'model' => $this->llmProvider->getModelName(),
        ];
    }
}

<?php

namespace Database\Seeders;

use App\Models\Conversation;
use App\Models\Document;
use App\Models\DocumentChunk;
use App\Models\Message;
use App\Models\User;
use App\Models\Workspace;
use App\Services\Ai\Mock\MockEmbeddingProvider;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database with complete enterprise RAG platform data.
     */
    public function run(): void
    {
        $this->command->info('Starting DocuMind AI comprehensive database seeding...');

        $isPgsql = DB::getDriverName() === 'pgsql';

        try {
            $embeddingProvider = app(\App\Services\Ai\AiManager::class)->createEmbeddingProvider();
            $testVec = $embeddingProvider->embed('DocuMind vector test');
            if (count($testVec) !== 384) {
                $embeddingProvider = new MockEmbeddingProvider(384);
            }
            $this->command->info('Using real embedding provider: ' . get_class($embeddingProvider));
        } catch (\Throwable $e) {
            $embeddingProvider = new MockEmbeddingProvider(384);
            $this->command->info('Fallback to MockEmbeddingProvider.');
        }

        // -------------------------------------------------------------
        // 1. SEED USERS (Admin, Active User, Pending User, Deactivated User)
        // -------------------------------------------------------------
        $this->command->info('Seeding users...');

        $admin = User::create([
            'name' => 'Admin DocuMind',
            'email' => 'admin@documind.com',
            'password' => Hash::make('secret'),
            'role' => 'admin',
            'status' => 'active',
            'email_verified_at' => now(),
        ]);

        $sarah = User::create([
            'name' => 'Sarah Connor',
            'email' => 'sarah@documind.com',
            'password' => Hash::make('secret'),
            'role' => 'user',
            'status' => 'active',
            'email_verified_at' => now(),
        ]);

        $david = User::create([
            'name' => 'David Miller',
            'email' => 'david@documind.com',
            'password' => Hash::make('secret'),
            'role' => 'user',
            'status' => 'pending', // Pending administrator approval
            'email_verified_at' => null,
        ]);

        $robert = User::create([
            'name' => 'Robert Vance',
            'email' => 'robert@documind.com',
            'password' => Hash::make('secret'),
            'role' => 'user',
            'status' => 'deactivated', // Deactivated by administrator
            'email_verified_at' => now(),
        ]);

        $this->command->info("Users created: Admin ({$admin->email}), Sarah ({$sarah->email}), David ({$david->email} - pending), Robert ({$robert->email} - deactivated).");

        // -------------------------------------------------------------
        // 2. SEED WORKSPACES & MEMBERSHIPS
        // -------------------------------------------------------------
        $this->command->info('Seeding workspaces...');

        $wsEnterprise = Workspace::create([
            'name' => 'Enterprise Knowledge Base',
            'slug' => 'enterprise-knowledge-base',
            'description' => 'Central repository for corporate policies, system architectures, and engineering runbooks.',
            'owner_id' => $admin->id,
        ]);

        $wsLegal = Workspace::create([
            'name' => 'Legal & Compliance Hub',
            'slug' => 'legal-compliance-hub',
            'description' => 'Enterprise master service agreements, GDPR compliance terms, NDAs, and audit policies.',
            'owner_id' => $admin->id,
        ]);

        $wsAi = Workspace::create([
            'name' => 'AI Engineering & Research',
            'slug' => 'ai-engineering-research',
            'description' => 'RAG pipeline evaluations, pgvector similarity benchmarks, and local LLM prompt templates.',
            'owner_id' => $admin->id,
        ]);

        $wsProduct = Workspace::create([
            'name' => 'Product Operations',
            'slug' => 'product-operations',
            'description' => 'Quarterly product roadmaps, user stories, customer interview summaries, and sprint goals.',
            'owner_id' => $sarah->id,
        ]);

        // Attach workspace users with roles
        $wsEnterprise->users()->attach([
            $admin->id => ['role' => 'owner'],
            $sarah->id => ['role' => 'member'],
        ]);

        $wsLegal->users()->attach([
            $admin->id => ['role' => 'owner'],
            $sarah->id => ['role' => 'viewer'],
        ]);

        $wsAi->users()->attach([
            $admin->id => ['role' => 'owner'],
        ]);

        $wsProduct->users()->attach([
            $sarah->id => ['role' => 'owner'],
            $admin->id => ['role' => 'admin'],
        ]);

        // -------------------------------------------------------------
        // 3. SEED DOCUMENTS & CHUNKS WITH EMBEDDINGS (pgvector 384d)
        // -------------------------------------------------------------
        $this->command->info('Seeding documents and pgvector chunks...');

        $documentsData = [
            [
                'workspace' => $wsEnterprise,
                'user' => $admin,
                'title' => 'DocuMind Architecture and Security Guide',
                'original_filename' => 'DocuMind_Architecture_and_Security_Guide.txt',
                'chunks' => [
                    [
                        'page' => 1,
                        'content' => "DocuMind AI is an enterprise document intelligence and hybrid RAG (Retrieval-Augmented Generation) platform. The system is engineered on a modern decoupled stack: a high-performance Laravel 12 REST API backend, PostgreSQL 18 with native pgvector 0.8.7 extension for vector similarity search, and a responsive Vite React TypeScript single-page application dashboard. The platform guarantees strict multi-tenant isolation across workspaces.",
                    ],
                    [
                        'page' => 1,
                        'content' => "Vector Embeddings & pgvector Storage Architecture: Documents uploaded to a workspace are split into overlapping chunks (350 tokens with 60-token sliding overlap). Dense 384-dimensional embeddings are generated for each chunk and stored in the dedicated 'embedding vector(384)' column on the document_chunks table. PostgreSQL HNSW (Hierarchical Navigable Small World) index is utilized with vector_cosine_ops for sub-millisecond nearest neighbor retrieval.",
                    ],
                    [
                        'page' => 2,
                        'content' => "Anti-Hallucination & Grounded Generation Pipeline: During conversational retrieval, user questions are embedded and matched against workspace chunks using the <=> cosine distance operator. The top-k matching chunks are assembled into a context prompt with explicit numbered citations [1], [2]. The language model is instructed to answer strictly based on the provided citations and explicitly decline speculation when sufficient context is absent.",
                    ],
                    [
                        'page' => 2,
                        'content' => "Security, Role-Based Access Control, and Admin Approvals: Authentication is enforced via Laravel Sanctum bearer tokens. New user registrations remain in 'pending' status until verified and approved by a system administrator. Deactivated accounts immediately have their active tokens revoked and are forbidden from accessing any workspace resources or the dashboard.",
                    ],
                ],
            ],
            [
                'workspace' => $wsEnterprise,
                'user' => $admin,
                'title' => 'Employee Handbook and Remote Work Policy',
                'original_filename' => 'Employee_Handbook_and_Remote_Work_Policy.txt',
                'chunks' => [
                    [
                        'page' => 1,
                        'content' => "Core Working Hours & Collaboration Principles: DocuMind maintains a remote-first culture with core collaboration hours between 10:00 AM and 4:00 PM local time. Team members are expected to be available for synchronous communication on Slack and daily standup meetings during these core hours. Flexible hours are supported outside core collaboration windows.",
                    ],
                    [
                        'page' => 1,
                        'content' => "Device Security & Information Protection: All company-issued workstations must have full-disk encryption activated (BitLocker for Windows, FileVault for macOS). Two-Factor Authentication (2FA) is mandatory across all cloud services, GitHub repositories, and production environments. Storing confidential customer data or unencrypted credentials on personal devices is strictly prohibited.",
                    ],
                    [
                        'page' => 2,
                        'content' => "Paid Time Off (PTO) & Health Benefits: Full-time employees are entitled to 20 days of paid vacation per calendar year, 10 days of paid sick and wellness leave, and all designated public holidays. Comprehensive health, dental, and vision insurance premiums are covered 100% by DocuMind for employees and 50% for dependents.",
                    ],
                ],
            ],
            [
                'workspace' => $wsLegal,
                'user' => $admin,
                'title' => 'Enterprise GDPR and Data Protection Agreement',
                'original_filename' => 'Enterprise_GDPR_and_Data_Protection_Agreement.txt',
                'chunks' => [
                    [
                        'page' => 1,
                        'content' => "Data Protection Principles & Lawful Processing: DocuMind processes customer documents and personal information in accordance with Article 6 and Article 28 of the General Data Protection Regulation (GDPR). All customer document files and vector representations are encrypted at rest using AES-256-GCM and encrypted in transit via TLS 1.3.",
                    ],
                    [
                        'page' => 1,
                        'content' => "Right to Erasure & Data Retention Guidelines: Pursuant to GDPR Article 17, customers retain the absolute right to demand immediate deletion of any uploaded documents, chunks, and conversation histories. When a user deletes a document or deletes an entire workspace, all relational records, pgvector embeddings, and physical files on disk are instantly and permanently purged.",
                    ],
                ],
            ],
            [
                'workspace' => $wsAi,
                'user' => $admin,
                'title' => 'RAG Chunking Strategies and HNSW Benchmarks',
                'original_filename' => 'RAG_Chunking_Strategies_and_HNSW_Benchmarks.txt',
                'chunks' => [
                    [
                        'page' => 1,
                        'content' => "Chunking Strategy Benchmark Analysis: In document processing, chunk size selection directly impacts retrieval accuracy. Testing across 5,000 legal and technical documents confirmed that 350-token chunks with 60-token overlap preserve sentence boundaries while avoiding truncation of complex technical specifications. Paragraph-level boundaries are prioritized before sentence-level splitting.",
                    ],
                    [
                        'page' => 1,
                        'content' => "HNSW Index Tuning in pgvector 0.8.7: The HNSW (Hierarchical Navigable Small World) index configured with parameters m=16 and ef_construction=64 achieved 99.4% recall on 100,000 embedded chunks. Average query latency measured 1.8 milliseconds per vector query, outperforming inverted file (IVFFlat) indexes under continuous concurrent workloads.",
                    ],
                ],
            ],
        ];

        $chunkCountTotal = 0;

        foreach ($documentsData as $docData) {
            $ws = $docData['workspace'];
            $user = $docData['user'];
            $uuid = (string) Str::uuid();
            $fileName = "{$uuid}.txt";
            $fullText = implode("\n\n", array_column($docData['chunks'], 'content'));

            // Write sample text file to local storage
            Storage::disk('local')->put("documents/{$ws->id}/{$fileName}", $fullText);

            $wordCount = str_word_count($fullText);
            $charCount = mb_strlen($fullText);
            $chunksArr = $docData['chunks'];
            $numChunks = count($chunksArr);

            $document = Document::create([
                'uuid' => $uuid,
                'workspace_id' => $ws->id,
                'user_id' => $user->id,
                'title' => $docData['title'],
                'original_filename' => $docData['original_filename'],
                'file_path' => "documents/{$ws->id}/{$fileName}",
                'mime_type' => 'text/plain',
                'file_size' => strlen($fullText),
                'file_hash' => hash('sha256', $fullText),
                'status' => 'completed',
                'error_message' => null,
                'page_count' => max(array_column($chunksArr, 'page')),
                'character_count' => $charCount,
                'word_count' => $wordCount,
                'metadata' => [
                    'total_chunks' => $numChunks,
                    'embedding_model' => 'all-minilm',
                    'embedding_dimensions' => 384,
                    'seeded' => true,
                    'processed_at' => now()->toIso8601String(),
                ],
            ]);

            foreach ($chunksArr as $idx => $chunkItem) {
                $vector = $embeddingProvider->embed($chunkItem['content']);
                $formattedVector = $isPgsql ? DocumentChunk::formatVector($vector) : json_encode($vector);
                $tokens = (int) ceil(str_word_count($chunkItem['content']) * 1.3);

                DocumentChunk::create([
                    'document_id' => $document->id,
                    'workspace_id' => $ws->id,
                    'chunk_index' => $idx,
                    'page_number' => $chunkItem['page'],
                    'content' => $chunkItem['content'],
                    'token_count' => $tokens,
                    'metadata' => [
                        'start_char' => 0,
                        'end_char' => mb_strlen($chunkItem['content']),
                        'source' => $document->original_filename,
                    ],
                    'embedding' => $formattedVector,
                ]);

                $chunkCountTotal++;
            }
        }

        $this->command->info("Seeded 4 documents with {$chunkCountTotal} pgvector chunks.");

        // -------------------------------------------------------------
        // 4. SEED CONVERSATIONS & GROUNDED RAG MESSAGES WITH CITATIONS
        // -------------------------------------------------------------
        $this->command->info('Seeding conversations and grounded chat messages...');

        $firstChunk = DocumentChunk::where('workspace_id', $wsEnterprise->id)->first();
        $secondChunk = DocumentChunk::where('workspace_id', $wsEnterprise->id)->skip(1)->first();

        // Conversation 1: Architecture & Vector Search
        $conv1 = Conversation::create([
            'uuid' => (string) Str::uuid(),
            'workspace_id' => $wsEnterprise->id,
            'user_id' => $admin->id,
            'title' => 'How does DocuMind handle pgvector embeddings?',
        ]);

        Message::create([
            'conversation_id' => $conv1->id,
            'role' => 'user',
            'content' => 'How does DocuMind store high-dimensional embeddings and execute similarity searches?',
            'citations' => null,
            'metadata' => ['tokens' => 12],
        ]);

        Message::create([
            'conversation_id' => $conv1->id,
            'role' => 'assistant',
            'content' => "DocuMind utilizes PostgreSQL 18 with the **pgvector 0.8.7** extension to store dense 384-dimensional embeddings directly in a dedicated `vector(384)` column on the `document_chunks` table [1].\n\nWhen a document is uploaded, text is divided into 350-token windows with 60-token overlap, and each chunk is converted into an embedding [2]. Nearest-neighbor searches are executed via an **HNSW (Hierarchical Navigable Small World)** index utilizing the `<=>` cosine distance operator, providing sub-millisecond retrieval speeds even under high concurrent load [2].",
            'citations' => [
                [
                    'number' => 1,
                    'chunk_id' => $firstChunk?->id ?? 1,
                    'document_id' => $firstChunk?->document_id ?? 1,
                    'document_title' => 'DocuMind Architecture and Security Guide',
                    'similarity' => 0.941,
                    'page_number' => 1,
                    'text' => $firstChunk?->content ?? 'PostgreSQL with native pgvector extension...',
                ],
                [
                    'number' => 2,
                    'chunk_id' => $secondChunk?->id ?? 2,
                    'document_id' => $secondChunk?->document_id ?? 1,
                    'document_title' => 'DocuMind Architecture and Security Guide',
                    'similarity' => 0.912,
                    'page_number' => 1,
                    'text' => $secondChunk?->content ?? 'Dense 384-dimensional embeddings are generated for each chunk...',
                ],
            ],
            'metadata' => [
                'model' => 'qwen2.5:1.5b',
                'context_chunks_count' => 2,
                'prompt_tokens' => 280,
                'completion_tokens' => 95,
            ],
        ]);

        // Conversation 2: GDPR & Erasure
        $legalChunk = DocumentChunk::where('workspace_id', $wsLegal->id)->first();

        $conv2 = Conversation::create([
            'uuid' => (string) Str::uuid(),
            'workspace_id' => $wsLegal->id,
            'user_id' => $admin->id,
            'title' => 'GDPR Data Retention and Erasure Protocol',
        ]);

        Message::create([
            'conversation_id' => $conv2->id,
            'role' => 'user',
            'content' => 'What is the exact process when a customer requests document erasure under GDPR Article 17?',
            'citations' => null,
            'metadata' => ['tokens' => 16],
        ]);

        Message::create([
            'conversation_id' => $conv2->id,
            'role' => 'assistant',
            'content' => "Under our Enterprise GDPR and Data Protection Agreement, customer document processing complies with Article 17 (Right to Erasure) [1].\n\nWhen a user deletes a document or deletes an entire workspace, all relational records, vector representations in pgvector, and physical files on the private storage disk are immediately and irreversibly destroyed through database cascading deletion [1].",
            'citations' => [
                [
                    'number' => 1,
                    'chunk_id' => $legalChunk?->id ?? 3,
                    'document_id' => $legalChunk?->document_id ?? 3,
                    'document_title' => 'Enterprise GDPR and Data Protection Agreement',
                    'similarity' => 0.925,
                    'page_number' => 1,
                    'text' => $legalChunk?->content ?? 'Pursuant to GDPR Article 17, customers retain the absolute right to demand immediate deletion...',
                ],
            ],
            'metadata' => [
                'model' => 'qwen2.5:1.5b',
                'context_chunks_count' => 1,
                'prompt_tokens' => 195,
                'completion_tokens' => 64,
            ],
        ]);

        $this->command->info('Seeding successfully completed! Admin: admin@documind.com / secret');
    }
}

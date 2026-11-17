# DocuMind AI — Enterprise Document Intelligence & Hybrid RAG Platform

<p align="center">
  <img src="https://img.shields.io/badge/Laravel-12.x-FF2D20?style=for-the-badge&logo=laravel&logoColor=white" alt="Laravel 12" />
  <img src="https://img.shields.io/badge/PHP-8.4-777BB4?style=for-the-badge&logo=php&logoColor=white" alt="PHP 8.4" />
  <img src="https://img.shields.io/badge/PostgreSQL-18_%2B_pgvector_0.8.7-336791?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL pgvector" />
  <img src="https://img.shields.io/badge/React-19_TypeScript-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React TypeScript" />
  <img src="https://img.shields.io/badge/TailwindCSS-v4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind CSS v4" />
  <img src="https://img.shields.io/badge/AI_Providers-Ollama_%7C_OpenAI_%7C_Gemini_%7C_Claude-8A2BE2?style=for-the-badge" alt="Multi-Provider AI" />
  <img src="https://img.shields.io/badge/Tests-53_Passed_(218_assertions)-success?style=for-the-badge" alt="Tests 53 Passed" />
</p>

---

## 📌 Executive Summary

**DocuMind AI** is an enterprise-grade, multi-tenant Document Intelligence and **Retrieval-Augmented Generation (RAG)** platform. Built on a decoupled modern architecture, it combines a high-performance **Laravel 12 REST API**, **PostgreSQL 18** with native **pgvector 0.8.7** HNSW vector cosine indexing, and a responsive **Vite + React 19 + TypeScript** SPA dashboard.

The platform allows organizations to ingest massive technical, legal, and operational documents (PDF, DOCX, TXT), split them into semantic overlapping chunks, embed them into 384-dimensional dense vectors, and perform grounded, anti-hallucinatory question answering with numbered citations (`[1]`, `[2]`).

---

## 🏢 Workspace Concept & Multi-Tenancy

In DocuMind AI, **Workspaces** are the core boundary of multi-tenancy and data isolation.

### Why Workspaces Matter:
1. **Strict Data Isolation**: Documents, vector embeddings, chunks, and chat conversations belong strictly to a single workspace (`workspace_id`). A vector similarity query executed in Workspace A will **never** scan or leak data from Workspace B.
2. **Team Separation**: An enterprise can create dedicated spaces for different departments:
   - `Enterprise Knowledge Base` (Corporate policies, SOPs, engineering architecture)
   - `Legal & Compliance Hub` (Contracts, GDPR policies, NDAs)
   - `Product Operations` (Sprint backlogs, user interview transcripts)
3. **Role-Based Workspace Access**:
   - `owner`: Can update/delete the workspace, invite members, upload docs, and configure settings.
   - `admin`: Can manage documents, conversations, and members.
   - `member`: Can upload documents, run searches, and chat with AI.
   - `viewer`: Read-only access to documents and chat.
4. **Cascading GDPR Deletion**: Deleting a workspace or document immediately triggers foreign key cascades, permanently purging all physical disk files, database rows, and vector representations in pgvector.

---

## 🧠 End-to-End RAG Lifecycle

Retrieval-Augmented Generation bridges the gap between static LLM weights and private enterprise knowledge:

### 1. Document Ingestion & Chunking Pipeline
1. **Upload**: User uploads a PDF, DOCX, or TXT file up to 20MB.
2. **Text Extraction**: `DocumentTextExtractor` extracts raw text and computes character, word, and page counts.
3. **Sliding-Window Chunking**: `TextChunker` breaks text into **350-token windows** with **60-token overlap**. Overlap prevents loss of semantic context across sentence and paragraph boundaries.
4. **Vector Embedding**: Each chunk is passed through the active embedding model (e.g. `all-minilm` or `text-embedding-3-small`), generating a normalized 384-dimensional float vector.
5. **pgvector Storage**: The chunk text, token count, page number, and vector are saved into `document_chunks`. An **HNSW index** with cosine distance (`vector_cosine_ops`) indexes the data in sub-milliseconds.

### 2. Conversational Retrieval & Generation Pipeline
1. **Question Embedding**: When a user asks a question (e.g., *"What is our remote work policy?"*), the query is converted into a 384d vector.
2. **Cosine Similarity Search**: PostgreSQL executes an HNSW nearest-neighbor query using the `<=>` cosine distance operator:
   ```sql
   SELECT *, (1 - (embedding <=> ?::vector)) AS similarity
   FROM document_chunks
   WHERE workspace_id = ?
   ORDER BY embedding <=> ?::vector ASC
   LIMIT 5;
   ```
3. **Context Construction with Citations**: `ContextBuilder` takes the top-ranked chunks, ensures they fit within the token budget (default 1,500 tokens), and formats them into an explicit prompt:
   ```text
   [1] (DocuMind Architecture Guide, Page 1):
   ...text of chunk 1...

   [2] (Employee Handbook, Page 2):
   ...text of chunk 2...
   ```
4. **Anti-Hallucination Prompting**: The system instructs the LLM:
   > *"Answer strictly using the provided bracketed sources [1], [2]. If the context does not contain sufficient information, state clearly that the answer is not available in the documents. Do not speculate."*
5. **Grounded Answer**: The AI returns a synthesized answer with interactive citation badges linking directly to source documents and page numbers.

---

## ✨ Key Platform Features

| Feature | Description |
| :--- | :--- |
| **Mandatory Authentication** | Dashboard is strictly protected. Guests cannot access data without authenticated credentials. |
| **Admin Registration Approval** | Anyone can register, but accounts remain `pending` until approved by an administrator. |
| **Instant User Deactivation** | Admin can deactivate accounts, which immediately invalidates all active Sanctum tokens. |
| **Dynamic AI Provider Switching** | Admin panel toggle between **OpenAI**, **Google Gemini**, **Anthropic Claude**, and **Local Ollama** with zero downtime. |
| **Encrypted API Keys at Rest** | API keys are stored in PostgreSQL using **AES-256** encryption (`APP_KEY`) and masked in the UI. |
| **Live Connection Tester** | Test AI API keys with real-time latency ping and verification response. |
| **Clean HTML5 URLs** | Professional URLs (`/dashboard`, `/chat`, `/documents`, `/workspaces`, `/users`, `/ai-settings`) without hash symbols (`/#/`). |
| **Unified Semantic Search** | Instant modal search (Ctrl + K) combining title keywords and deep vector chunk search. |
| **Exportable Conversations** | Export chat sessions to GitHub-flavored **Markdown** or structured **JSON**. |
| **One-Click Windows Launchers** | Pre-built `.bat` scripts to run backend, queue, and frontend with single clicks. |

---

## 🛠️ Tech Stack & Directory Structure

```text
documind-ai/
├── backend/                             # Laravel 12 REST API
│   ├── app/
│   │   ├── Http/Controllers/Api/V1/    # Auth, Workspace, Document, Chat, Admin Controllers
│   │   ├── Http/Middleware/             # EnsureUserIsActive, EnsureUserIsAdmin
│   │   ├── Jobs/                        # ProcessDocumentJob (Async chunking & embedding)
│   │   ├── Models/                      # User, Workspace, Document, DocumentChunk, AiSetting
│   │   └── Services/
│   │       ├── Ai/                      # Ollama, OpenAI, Gemini, Claude, Mock providers
│   │       ├── Document/                # Text extraction (PDF/DOCX/TXT) & TextChunker
│   │       └── Rag/                     # ContextBuilder, DocumentRetriever, RagService
│   ├── config/ai.php                    # Provider, model, chunk size, overlap configurations
│   ├── database/migrations/             # pgvector extension, users, workspaces, chunks, ai_settings
│   ├── database/seeders/                # Comprehensive enterprise seeder
│   ├── tests/                           # 53 Unit and Feature tests (100% passing)
│   └── artisan.bat                      # Windows PHP 8.4 runtime wrapper
│
├── frontend/                            # React 19 + TypeScript SPA
│   ├── src/
│   │   ├── api/                         # Axios client, auth, workspaces, documents, chat, aiSettings
│   │   ├── components/                  # Sidebar, TopNavbar, SearchModal, AuthModal, ChunkInspector
│   │   ├── context/                     # AuthContext (token, user, quickDemoLogin, activeWorkspace)
│   │   ├── pages/                       # DashboardView, DocumentsView, ChatView, WorkspacesView,
│   │   │                                # AdminUsersView, AdminAiSettingsView, LoginView
│   │   └── types/                       # TypeScript models & interfaces
│   └── package.json                     # Vite, TailwindCSS v4, Lucide React
│
├── run-all.bat                          # One-click launch all 3 services
├── run-backend.bat                      # Launches Laravel API on Port 8000 (PHP 8.4)
├── run-queue.bat                        # Launches background queue worker
└── run-frontend.bat                     # Launches Vite Frontend on Port 5173
```

---

## 🚀 Quick Start Guide

### Prerequisites
- **PHP**: `8.4+` (WinGet package or local install)
- **PostgreSQL**: `18+` with **pgvector 0.8.7** extension enabled
- **Node.js**: `18+` & `npm`
- **Ollama** *(Optional for local AI)*: With `qwen2.5:1.5b` and `all-minilm` pulled

### 1. Backend Setup
```bash
cd backend

# Copy environment configuration
cp .env.example .env

# Configure PostgreSQL in .env:
# DB_CONNECTION=pgsql
# DB_HOST=127.0.0.1
# DB_PORT=5432
# DB_DATABASE=documind_ai
# DB_USERNAME=your_username
# DB_PASSWORD=your_password

# Run database migrations and seed enterprise sample data
.\artisan.bat migrate:fresh --seed
```

### 2. Frontend Setup
```bash
cd ../frontend

# Install dependencies
npm install

# Test production build
npm run build
```

### 3. Launching the Platform

#### Option A: One-Click Windows Launchers (Recommended)
Double-click **`run-all.bat`** in the project root. It opens:
1. Backend Server on `http://127.0.0.1:8000`
2. Queue Worker for document ingestion
3. Frontend Vite Server on `http://127.0.0.1:5173`

#### Option B: Manual Command Line
```bash
# Terminal 1 - Backend API:
cd backend
.\artisan.bat serve --port 8000

# Terminal 2 - Background Queue Worker:
cd backend
.\artisan.bat queue:work --tries=3 --timeout=180

# Terminal 3 - Frontend SPA:
cd frontend
npm run dev -- --host 127.0.0.1 --port 5173
```

---

## 🔐 Default Credentials & Seed Data

| Role | Name | Email | Password | Status | Purpose |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **System Admin** | Admin DocuMind | `admin@documind.com` | `secret` | `active` | Full control over users, workspaces & AI API keys |
| **Standard User** | Sarah Connor | `sarah@documind.com` | `secret` | `active` | Regular team member workspace testing |
| **Pending User** | David Miller | `david@documind.com` | `secret` | `pending` | For testing Admin Approval / Activation flow |
| **Deactivated User** | Robert Vance | `robert@documind.com` | `secret` | `deactivated` | For testing instant token revocation & access blocking |

*(A **"One-Click Admin Login"** button is also available on the login screen for instant demo access)*

---

## 🧪 Running Automated Tests

DocuMind AI comes with a complete suite of **53 automated unit and feature tests**:

```bash
cd backend
.\artisan.bat test
```

### Test Coverage Highlights:
- ✅ `Tests\Unit\TextChunkerTest`: Verifies 350-token sliding windows and 60-token overlap boundaries.
- ✅ `Tests\Unit\ContextBuilderTest`: Verifies citation numbering and strict token budgeting.
- ✅ `Tests\Feature\DocumentChunkingTest`: Validates end-to-end document text extraction and pgvector generation.
- ✅ `Tests\Feature\RagServiceTest`: Validates grounded responses and empty workspace fallbacks.
- ✅ `Tests\Feature\UserApprovalAndStatusTest`: Validates admin registration approval, token revocation on deactivation, and self-demotion prevention.
- ✅ `Tests\Feature\AdminAiSettingsTest`: Validates AES-256 encryption at rest, masked key display, and dynamic provider switching.

---

## 📡 Core API Endpoints

### Authentication
- `POST /api/v1/auth/register` — Create account (pending admin approval for subsequent users)
- `POST /api/v1/auth/login` — Authenticate and issue Sanctum token (rejects pending/deactivated accounts)
- `POST /api/v1/auth/logout` — Revoke token
- `GET  /api/v1/auth/me` — Retrieve active profile, roles, and status

### Admin Management (`user.admin` middleware)
- `GET   /api/v1/admin/users` — List all registered users with workspace counts
- `PATCH /api/v1/admin/users/{user}/status` — Approve, deactivate, or set pending
- `PATCH /api/v1/admin/users/{user}/role` — Promote to admin or demote to user
- `GET   /api/v1/admin/ai-settings` — Retrieve active AI providers and masked API keys
- `PUT   /api/v1/admin/ai-settings` — Update AI providers, models, hyperparams, and API keys
- `POST  /api/v1/admin/ai-settings/test-connection` — Live ping test for OpenAI, Gemini, Claude, or Ollama

### Workspaces & Documents
- `GET    /api/v1/workspaces` — List accessible workspaces
- `POST   /api/v1/workspaces` — Create new workspace
- `GET    /api/v1/workspaces/{workspace}/documents` — List workspace documents
- `POST   /api/v1/workspaces/{workspace}/documents` — Upload and dispatch document for async vectorization
- `GET    /api/v1/workspaces/{workspace}/documents/{document}/chunks` — Inspect raw text chunks and vector embeddings

### Conversational RAG & Search
- `GET    /api/v1/workspaces/{workspace}/conversations` — List workspace chat history
- `POST   /api/v1/workspaces/{workspace}/conversations` — Start new conversation thread
- `POST   /api/v1/workspaces/{workspace}/conversations/{conversation}/messages` — Send message and receive grounded RAG answer with citations
- `GET    /api/v1/workspaces/{workspace}/conversations/{conversation}/export` — Export chat as Markdown or JSON
- `GET    /api/v1/workspaces/{workspace}/search?q=...` — Unified title & pgvector chunk search

---

## 📄 License
This project is open-source and available under the [MIT License](LICENSE).

# RAG Pipeline

Full-stack Retrieval-Augmented Generation (RAG) project with:

- a TypeScript + Express backend for ingestion, retrieval, and response generation
- a React + Vite frontend for chatting with the indexed knowledge base
- a sample FAQ dataset for local end-to-end testing

The project is set up as two apps in one repository:

```text
RAG_Pipeline/
  Backend/   Express API, embeddings, vector search, FAQ ingestion
  Frontend/  React chat UI for querying the backend
```

## What It Does

This project loads FAQ data from `Backend/data/beem_faqs.json`, turns each FAQ into an embedding, stores those embeddings in memory, retrieves the most relevant matches for a user question, and sends the retrieved context to an OpenAI-compatible chat model to generate the final answer.

The frontend provides a small chat workspace that:

- automatically tries to ingest the FAQ dataset on load
- lets you ask questions against the indexed knowledge base
- shows answer latency
- shows the source FAQs and similarity scores used for each answer

## Architecture

```text
FAQ JSON
  -> POST /ingest
  -> local embedding generation with @xenova/transformers
  -> in-memory vector store

User question
  -> POST /query
  -> local embedding generation
  -> cosine similarity search over indexed FAQs
  -> top-K context assembly
  -> OpenAI-compatible chat completion
  -> answer + sources + latency
```

## Stack

### Backend

- Node.js
- TypeScript
- Express
- `@xenova/transformers` for local sentence embeddings
- in-memory vector store with cosine similarity search
- OpenAI-compatible chat completions via `LLM_BASE_URL`

### Frontend

- React
- TypeScript
- Vite

## Repository Layout

```text
Backend/
  data/
    beem_faqs.json
  src/
    index.ts
    routes/
      dashboard.ts
      ingest.ts
      query.ts
    services/
      embedding.ts
      ragService.ts
      ragServiceInstance.ts
      vectorStore.ts
    utils/
      similarity.ts

Frontend/
  src/
    App.tsx
    api.ts
    App.css
    index.css
  vite.config.ts
```

## Prerequisites

- Node.js 18+ recommended
- npm
- an API key for an OpenAI-compatible chat completion provider

## Quick Start

### 1. Install dependencies

In one terminal:

```powershell
cd Backend
npm install
```

In another terminal:

```powershell
cd Frontend
npm install
```

### 2. Configure the backend

Create `Backend/.env` from `Backend/.env.example`:

```powershell
cd Backend
Copy-Item .env.example .env
```

Set your values:

```env
LLM_BASE_URL="https://api.openai.com/v1"
LLM_API_KEY="your-api-key"
LLM_MODEL="gpt-4o-mini"
PORT=3000
NODE_ENV=development
```

Notes:

- `LLM_API_KEY` is the primary key used by the backend.
- `OPENAI_API_KEY` is also accepted by the code as a fallback.
- `FRONTEND_ORIGIN` is optional. If omitted, the backend allows `http://localhost:5173`.

### 3. Start the backend

```powershell
cd Backend
npm run dev
```

The API will be available at `http://localhost:3000`.

### 4. Start the frontend

```powershell
cd Frontend
npm run dev
```

Open the Vite app, usually at `http://localhost:5173`.

During local development, the frontend sends requests to `/api`, and Vite proxies them to `http://localhost:3000`.

## First-Run Behavior

Embeddings are generated locally with the model `sentence-transformers/all-MiniLM-L6-v2`.

On the first ingestion or query, the backend may download model files and cache them under:

```text
Backend/.cache/transformers
```

That means the first run can take longer than later runs.

## How To Use It

### From the frontend

1. Start both apps.
2. Open the frontend in your browser.
3. Wait for the initial ingest attempt to complete.
4. Ask a question such as:
   - `How do I create a Beem account?`
   - `Which countries does Beem support?`
   - `What are the transaction fees?`

### From the API

The samples below were verified locally against the running backend and Ollama-backed model on April 30, 2026. Exact timestamps, latency, and similarity scores will vary between runs.
The request examples are written in bash-style `curl`; on Windows PowerShell, prefer `curl.exe` or `Invoke-RestMethod` if quoting gets in the way.

#### 1. Health check

```bash
curl http://localhost:3000/health
```

```json
{
  "status": "ok",
  "timestamp": "2026-04-29T19:41:58.440Z"
}
```

#### 2. Ingest the FAQ dataset

```bash
curl -X POST http://localhost:3000/ingest
```

```json
{
  "message": "Ingestion complete",
  "ingested": 10,
  "skipped": 0,
  "total_documents": 10
}
```

#### 3. Query: account creation

```bash
curl -X POST http://localhost:3000/query \
  -H "Content-Type: application/json" \
  -d '{
    "question": "How do I create a Beem account?",
    "top_k": 3
  }'
```

```json
{
  "answer": "Creating a Beem account is simple. Download the Beem app, provide your phone number, and complete identity verification. You'll be ready to send and receive money in minutes.",
  "sources": [
    {
      "id": "faq_002",
      "question": "How do I create a Beem account?",
      "answer": "Creating a Beem account is simple. Download the Beem app, provide your phone number, and complete identity verification. You'll be ready to send and receive money in minutes.",
      "category": "account",
      "score": 0.8235479679352019
    },
    {
      "id": "faq_001",
      "question": "What is Beem?",
      "answer": "Beem is a fintech platform that enables fast, secure, and affordable money transfers. We provide seamless payment solutions for individuals and businesses across Africa.",
      "category": "general",
      "score": 0.5883799394763148
    },
    {
      "id": "faq_005",
      "question": "Is Beem secure?",
      "answer": "Yes, Beem uses bank-level encryption and multi-factor authentication to protect your account. All transactions are monitored for fraud and your funds are insured up to $100,000.",
      "category": "security",
      "score": 0.5709556539363475
    }
  ],
  "latency_ms": 10295
}
```

#### 4. Query: supported countries

```bash
curl -X POST http://localhost:3000/query \
  -H "Content-Type: application/json" \
  -d '{
    "question": "Which countries does Beem support?",
    "top_k": 2
  }'
```

```json
{
  "answer": "Beem currently operates in 15 African countries including Kenya, Uganda, Nigeria, Tanzania, Ghana, and Rwanda.",
  "sources": [
    {
      "id": "faq_007",
      "question": "Which countries does Beem support?",
      "answer": "Beem currently operates in 15 African countries including Kenya, Uganda, Nigeria, Tanzania, Ghana, and Rwanda. We are expanding to more countries monthly.",
      "category": "coverage",
      "score": 0.8631658117301202
    },
    {
      "id": "faq_001",
      "question": "What is Beem?",
      "answer": "Beem is a fintech platform that enables fast, secure, and affordable money transfers. We provide seamless payment solutions for individuals and businesses across Africa.",
      "category": "general",
      "score": 0.51753123838955
    }
  ],
  "latency_ms": 7421
}
```

#### 5. Query: out-of-scope question

```bash
curl -X POST http://localhost:3000/query \
  -H "Content-Type: application/json" \
  -d '{
    "question": "What is the capital of France?",
    "top_k": 2
  }'
```

```json
{
  "answer": "I don't have enough information.",
  "sources": [
    {
      "id": "faq_007",
      "question": "Which countries does Beem support?",
      "answer": "Beem currently operates in 15 African countries including Kenya, Uganda, Nigeria, Tanzania, Ghana, and Rwanda. We are expanding to more countries monthly.",
      "category": "coverage",
      "score": 0.1154909239050259
    },
    {
      "id": "faq_009",
      "question": "Can I transfer money to any bank?",
      "answer": "Yes, Beem supports transfers to all major banks in supported countries. You can also send money directly to mobile wallets and other digital payment platforms.",
      "category": "transfers",
      "score": 0.04888406072255601
    }
  ],
  "latency_ms": 13415
}
```

## API Endpoints

### `GET /health`

Returns service status and a timestamp.

### `POST /ingest`

Loads `Backend/data/beem_faqs.json`, validates each FAQ, generates embeddings, and stores documents in the in-memory vector store.

Key behavior:

- safe to call repeatedly
- existing document IDs are skipped
- returns ingestion counts and total indexed documents

### `POST /query`

Accepts:

```json
{
  "question": "How do I create a Beem account?",
  "top_k": 3
}
```

Returns:

- final answer
- retrieved source FAQs
- end-to-end latency in milliseconds

## Development Commands

### Backend

```powershell
cd Backend
npm run dev
npm run build
npm run start
npm run typecheck
```

### Frontend

```powershell
cd Frontend
npm run dev
npm run build
npm run preview
npm run lint
```

## Important Implementation Notes

- The vector store is in memory only. Restarting the backend clears indexed documents.
- Retrieval uses brute-force cosine similarity over all stored documents.
- Ingestion currently reads from a single local JSON file: `Backend/data/beem_faqs.json`.
- The backend also serves a simple HTML dashboard at `http://localhost:3000/`, separate from the React frontend.
- The final answer is generated by a chat completion provider, while embeddings are generated locally.

## Limitations

- No persistence for embeddings or indexed documents
- No authentication or rate limiting
- No background job queue for large ingests
- Search performance scales linearly with document count
- Sample data is FAQ-sized and intended for local development/demo use

## Where To Look Next

- Backend service details: [Backend/README.md](Backend/README.md)
- Backend technical notes: [Backend/TECHNICAL.md](Backend/TECHNICAL.md)
- Frontend app source: [Frontend/src/App.tsx](Frontend/src/App.tsx)

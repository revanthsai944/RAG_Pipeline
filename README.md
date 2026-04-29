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

Health check:

```bash
curl http://localhost:3000/health
```

Ingest the FAQ dataset:

```bash
curl -X POST http://localhost:3000/ingest
```

Query the RAG pipeline:

```bash
curl -X POST http://localhost:3000/query \
  -H "Content-Type: application/json" \
  -d '{
    "question": "How do I create a Beem account?",
    "top_k": 3
  }'
```

Example response shape:

```json
{
  "answer": "Creating a Beem account is simple...",
  "sources": [
    {
      "id": "faq_002",
      "question": "How do I create a Beem account?",
      "answer": "Creating a Beem account is simple...",
      "category": "account",
      "score": 0.91
    }
  ],
  "latency_ms": 1247
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


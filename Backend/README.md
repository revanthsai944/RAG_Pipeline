# RAG Microservice

A production-aware Retrieval-Augmented Generation (RAG) microservice built with TypeScript, Node.js, and Express.

## Architecture

```
/ingest endpoint
    ↓
Load FAQ JSON → Chunk (Q+A) → Generate Embeddings → In-Memory Vector Store

/query endpoint
    ↓
Embed Query → Cosine Similarity Search → Top-K FAQs → LLM Prompt → GPT-4o-mini → Response + Sources + Latency
```

## Features

- ✅ TypeScript with strict mode enabled
- ✅ In-memory vector store (no external DB required)
- ✅ OpenAI embeddings (text-embedding-3-small)
- ✅ GPT-4o-mini LLM integration
- ✅ Cosine similarity search
- ✅ Idempotent ingestion (no duplicates)
- ✅ Real latency measurement (milliseconds)
- ✅ Production-ready error handling
- ✅ Comprehensive logging
- ✅ Health check endpoint

## Project Structure

```
/src
  /routes
    ingest.ts      - FAQ ingestion endpoint
    query.ts       - Query/RAG endpoint
  /services
    embedding.ts   - OpenAI API integration
    vectorStore.ts - In-memory vector storage
    ragService.ts  - RAG orchestration logic
  /utils
    similarity.ts  - Cosine similarity calculation
  index.ts         - Express app setup

/data
  beem_faqs.json   - Sample FAQ data

.env.example       - Environment variables template
tsconfig.json      - TypeScript configuration
package.json       - Dependencies and scripts
```

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Create a `.env` file based on `.env.example`:

```bash
cp .env.example .env
```

Add your OpenAI API key:

```
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxx
PORT=3000
NODE_ENV=development
```

### 3. Run the Service

**Development mode (with hot reload):**

```bash
npm run dev
```

**Production build:**

```bash
npm run build
npm start
```

## API Endpoints

### POST /ingest

Loads FAQ data from `data/beem_faqs.json` and ingests into the vector store.

**Request:**
```bash
curl -X POST http://localhost:3000/ingest
```

**Response:**
```json
{
  "message": "Ingestion complete",
  "ingested": 10,
  "skipped": 0,
  "total_documents": 10
}
```

### POST /query

Queries the RAG system and returns an answer with sources.

**Request:**
```bash
curl -X POST http://localhost:3000/query \
  -H "Content-Type: application/json" \
  -d '{
    "question": "How do I create an account?",
    "top_k": 3
  }'
```

**Response:**
```json
{
  "answer": "Creating a Beem account is simple. Download the Beem app, provide your phone number, and complete identity verification. You'll be ready to send and receive money in minutes.",
  "sources": ["faq_002"],
  "latency_ms": 1247
}
```

### GET /health

Health check endpoint.

**Request:**
```bash
curl http://localhost:3000/health
```

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2026-04-28T10:30:00.000Z"
}
```

## Idempotency

The `/ingest` endpoint is idempotent:
- Calling it multiple times won't create duplicate entries
- Documents are identified by their `id` field
- If a document already exists, it's skipped with a log message

## Error Handling

The service includes comprehensive error handling:

- Missing/invalid FAQ data → 400 Bad Request
- OpenAI API errors → 500 Internal Server Error
- Invalid query parameters → 400 Bad Request
- Non-existent endpoints → 404 Not Found

## Performance

- **Embedding generation:** ~500-800ms per request
- **Vector search:** O(n) cosine similarity on all documents
- **LLM response:** ~1-2s depending on token count
- **Total latency:** Measured and returned in every response

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| OPENAI_API_KEY | Yes | - | Your OpenAI API key |
| PORT | No | 3000 | Server port |
| NODE_ENV | No | development | Environment (development/production) |

## Testing

Test idempotency by calling `/ingest` multiple times:

```bash
# First call
curl -X POST http://localhost:3000/ingest

# Second call (should skip all documents)
curl -X POST http://localhost:3000/ingest
```

Test different query types:

```bash
# General question
curl -X POST http://localhost:3000/query \
  -H "Content-Type: application/json" \
  -d '{"question": "What countries do you support?"}'

# Pricing question
curl -X POST http://localhost:3000/query \
  -H "Content-Type: application/json" \
  -d '{"question": "How much does a transfer cost?"}'

# Out-of-scope question
curl -X POST http://localhost:3000/query \
  -H "Content-Type: application/json" \
  -d '{"question": "What is the weather today?"}'
```

## TypeScript Strict Mode

All code runs with TypeScript strict mode enabled:

```json
{
  "strict": true
}
```

This ensures:
- All variables and parameters have explicit types
- No implicit `any` types
- Null/undefined checks required
- Strict null checking
- Full type safety throughout the codebase

## Production Considerations

When deploying to production:

1. Use a proper vector database (Pinecone, Weaviate, etc.) for scaling
2. Implement caching layer for frequent queries
3. Add rate limiting and authentication
4. Use persistent storage instead of in-memory
5. Monitor API costs and usage
6. Implement request validation and sanitization
7. Add distributed tracing and monitoring
8. Use environment-specific configurations

## License

MIT

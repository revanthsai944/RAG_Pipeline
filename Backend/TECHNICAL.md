# RAG Microservice - Technical Documentation

## Overview

This is a production-aware Retrieval-Augmented Generation (RAG) microservice that combines OpenAI embeddings and LLM capabilities with an in-memory vector store to answer questions based on a knowledge base (FAQ data).

## Core Architecture

### Data Flow: Ingestion

```
FAQ JSON File
    ↓
Load & Parse
    ↓
For each FAQ:
    ├─ Combine Q+A into single text chunk
    ├─ Generate embedding (text-embedding-3-small)
    ├─ Check idempotency (skip if already exists)
    └─ Store in memory vector store
```

### Data Flow: Query

```
User Question
    ↓
Generate embedding (text-embedding-3-small)
    ↓
Compute cosine similarity with all stored embeddings
    ↓
Retrieve top-K most similar documents
    ↓
Build LLM prompt with context
    ↓
Call GPT-4o-mini
    ↓
Parse & return response + sources + latency
```

## Key Components

### 1. VectorStore (`src/services/vectorStore.ts`)

**Responsibility:** In-memory document storage

**Data Structure:**
```typescript
interface StoredDocument {
  id: string;           // Unique document identifier
  text: string;         // Combined Q+A text
  embedding: number[]; // 1536-dimensional OpenAI embedding
  category: string;     // FAQ category
}
```

**Key Methods:**
- `addDocument(doc)` - Store or update a document
- `getAllDocuments()` - Retrieve all documents
- `getDocument(id)` - Get specific document
- `hasDocument(id)` - Check existence (for idempotency)
- `getDocumentCount()` - Get total count
- `clear()` - Reset store

**Complexity:**
- `addDocument`: O(1) using Map
- `getAllDocuments`: O(n)
- `getDocument`: O(1) Map lookup

### 2. Embedding Service (`src/services/embedding.ts`)

**Responsibility:** OpenAI API integration

**Functions:**

#### `generateEmbedding(text: string): Promise<number[]>`
- Uses OpenAI `text-embedding-3-small` model
- Returns 1536-dimensional vector
- Throws error if API fails

#### `generateResponse(systemPrompt: string, userQuestion: string): Promise<string>`
- Calls OpenAI `gpt-4o-mini` model
- System prompt ensures RAG constraints
- Temperature set to 0.3 (low randomness)

**API Costs:**
- Embeddings: ~$0.00002 per 1K tokens
- GPT-4o-mini: ~$0.15 per 1M input tokens, ~$0.60 per 1M output tokens

### 3. RAG Service (`src/services/ragService.ts`)

**Responsibility:** Orchestrate RAG workflow

**Methods:**

#### `ingestFAQ(...): Promise<void>`
```typescript
async ingestFAQ(
  faqId: string,
  question: string,
  answer: string,
  category: string
): Promise<void>
```
- Combines question + answer
- Generates embedding
- Checks idempotency (skips duplicates)
- Stores in vector store
- Logs progress

**Idempotency:**
- Uses `vectorStore.hasDocument()` check
- Prevents duplicate embeddings
- Safe to call multiple times
- FAQ ID must be unique

#### `query(question: string, topK: number): Promise<QueryResult>`
```typescript
async query(
  question: string,
  topK: number = 3
): Promise<QueryResult>
```

**Returns:**
```typescript
interface QueryResult {
  answer: string;      // LLM response
  sources: string[];   // FAQ IDs used
  latency_ms: number;  // End-to-end latency
}
```

**Flow:**
1. Start performance timer
2. Generate embedding for question
3. Compute cosine similarity with all documents
4. Sort by score, take top-K
5. Build context from top-K documents
6. Generate LLM response
7. Calculate and return latency

**Latency Measurement:**
- Uses `performance.now()` for millisecond precision
- Measures entire operation end-to-end
- Includes embedding generation, similarity search, and LLM call

### 4. Similarity Utility (`src/utils/similarity.ts`)

**Function:** `cosineSimilarity(vecA: number[], vecB: number[]): number`

**Formula:**
```
cos(θ) = (A · B) / (||A|| × ||B||)
```

Where:
- `A · B` = dot product
- `||A||` = Euclidean norm of A
- `||B||` = Euclidean norm of B

**Properties:**
- Range: -1 to 1 (typically 0 to 1 for text embeddings)
- Higher score = more similar
- Throws error on dimension mismatch
- O(n) complexity where n is vector dimension

### 5. Routes

#### POST /ingest

**File:** `src/routes/ingest.ts`

**Logic:**
1. Read FAQ JSON from `data/beem_faqs.json`
2. Validate JSON format (must be array)
3. Validate each FAQ has required fields
4. Call `ragService.ingestFAQ()` for each
5. Return ingestion statistics

**Response:**
```json
{
  "message": "Ingestion complete",
  "ingested": 10,
  "skipped": 0,
  "total_documents": 10
}
```

**Error Handling:**
- File not found → 400 Bad Request
- Invalid JSON → 400 Bad Request
- Invalid structure → 400 Bad Request
- API errors → 500 Internal Server Error

#### POST /query

**File:** `src/routes/query.ts`

**Logic:**
1. Extract `question` and `top_k` from request body
2. Validate `question` is non-empty string
3. Validate `top_k` > 0
4. Call `ragService.query()`
5. Return result

**Response:**
```json
{
  "answer": "...",
  "sources": ["faq_001", "faq_002"],
  "latency_ms": 1234
}
```

**Error Handling:**
- Missing/invalid question → 400 Bad Request
- Invalid top_k → 400 Bad Request
- No documents in store → graceful response with "I don't have enough information"
- API errors → 500 Internal Server Error

#### GET /health

**File:** `src/index.ts`

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2026-04-28T10:30:00.000Z"
}
```

## TypeScript Strict Mode

All code compiled with `"strict": true`:

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictBindCallApply": true,
    "strictPropertyInitialization": true,
    "noImplicitThis": true,
    "alwaysStrict": true
  }
}
```

**Benefits:**
- Type safety throughout
- Null/undefined must be explicitly handled
- No implicit `any` types
- Function signatures are enforced
- Better IDE support and refactoring

## Performance Characteristics

### Embedding Generation
- **Model:** text-embedding-3-small
- **Dimension:** 1536
- **Time:** ~500-800ms per request
- **Cost:** $0.00002 per 1K tokens

### Vector Search (Cosine Similarity)
- **Algorithm:** Brute force (O(n·d))
  - n = number of documents
  - d = embedding dimension (1536)
- **Time:** ~1-5ms for 100 documents, ~10-50ms for 1000 documents
- **Space:** O(n·d) = ~2.3MB per 1000 documents

### LLM Response Generation
- **Model:** gpt-4o-mini
- **Time:** ~1-2 seconds
- **Context:** Depends on top_k documents
- **Cost:** ~$0.15/$0.60 per 1M tokens (input/output)

### Total End-to-End Latency
- Typical: 2-3 seconds
- Measured and returned in every response
- Breakdown:
  - Embedding generation: 500-800ms
  - Vector search: 1-50ms
  - LLM call: 1-2000ms

## Scalability Limitations (In-Memory)

**Current Implementation:**
- All data in RAM
- O(n) search complexity
- No persistence
- Single-process only

**Limitations:**
- Max documents: ~100K-1M (depends on available RAM)
- Query latency grows linearly with document count
- No data persistence across restarts
- No distributed querying

**Production Solutions:**
1. **Vector DB:** Pinecone, Weaviate, Qdrant, Milvus
   - Sub-millisecond vector search
   - Persistent storage
   - Distributed scaling

2. **Caching:** Redis, Memcached
   - Cache frequently asked questions
   - Reduce API calls to OpenAI

3. **Async Processing:** Celery, Bull
   - Queue ingestion tasks
   - Background embedding generation

## Error Handling Strategy

### Client Errors (4xx)
- Bad Request: Invalid input format
- Not Found: Non-existent endpoint

### Server Errors (5xx)
- OpenAI API failures
- Unhandled exceptions
- Returns generic error message to client

### Logging
- Console logging for debugging
- Each major operation logged
- Error stack traces printed

### Graceful Degradation
- No documents in store → "I don't have enough information"
- Single API call fails → error response
- No cascading failures

## Environment Configuration

**Required:**
- `OPENAI_API_KEY` - Your OpenAI API key

**Optional:**
- `PORT` - Server port (default: 3000)
- `NODE_ENV` - Environment (default: development)

**Validation:**
- API key validated on first embedding call
- Missing key → 500 error from OpenAI SDK

## Testing Strategy

### Unit Testing (Not Implemented)
- Similarity calculation
- Vector store operations
- Request validation

### Integration Testing (Manual)
- `/ingest` idempotency
- `/query` with various inputs
- Out-of-scope questions
- Error scenarios

### Load Testing
- High document count (10K+)
- Concurrent queries
- Embedding cache effectiveness

## Security Considerations

**Current Implementation:**
- No authentication/authorization
- No rate limiting
- No input sanitization
- API key in environment

**Production Hardening:**
1. API Key Management
   - Use secret manager (AWS Secrets, Azure Key Vault)
   - Rotate keys regularly
   - Monitor API usage

2. Authentication
   - Add JWT or API key auth
   - Rate limiting per user
   - Request validation

3. Input Validation
   - Sanitize question input
   - Size limits on FAQ content
   - SQL/injection prevention

4. Monitoring
   - Track API costs
   - Monitor latency
   - Alert on errors
   - Log all queries (for auditing)

5. Data Privacy
   - Encrypt in transit (HTTPS)
   - Encrypt at rest
   - GDPR compliance for EU users
   - Data retention policies

## Deployment

### Development
```bash
npm run dev
```

### Production
```bash
npm run build
npm start
```

### Docker
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY dist ./dist
COPY data ./data
CMD ["node", "dist/index.js"]
```

### Environment
- Node.js 16+
- 512MB+ RAM (for in-memory store)
- HTTPS recommended
- Load balancer for multiple instances

## Future Enhancements

1. **Vector Database Integration**
   - Replace in-memory store with Pinecone/Weaviate
   - Enable horizontal scaling

2. **Caching Layer**
   - Cache embeddings for identical questions
   - Cache LLM responses

3. **Document Management**
   - Add DELETE endpoint
   - Add UPDATE endpoint
   - Batch ingestion

4. **Advanced RAG**
   - Hybrid search (keyword + semantic)
   - Re-ranking with cross-encoders
   - Query expansion

5. **Monitoring**
   - Prometheus metrics
   - Tracing (OpenTelemetry)
   - Custom dashboards

6. **Multi-language**
   - Support for multiple languages
   - Translation layer

## References

- [OpenAI API Docs](https://platform.openai.com/docs)
- [Cosine Similarity](https://en.wikipedia.org/wiki/Cosine_similarity)
- [RAG Overview](https://arxiv.org/abs/2005.11401)
- [Vector Databases](https://huggingface.co/blog/rag-lm)

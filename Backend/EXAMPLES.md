# RAG Microservice - API Examples

## Health Check

```bash
curl -X GET http://localhost:3000/health
```

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2026-04-28T10:30:00.000Z"
}
```

---

## Ingest FAQ Data

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

---

## Query Example 1: Account Creation

```bash
curl -X POST http://localhost:3000/query \
  -H "Content-Type: application/json" \
  -d "{\"question\": \"How do I create an account?\", \"top_k\": 3}"
```

**Response:**
```json
{
  "answer": "Creating a Beem account is simple. Download the Beem app, provide your phone number, and complete identity verification. You'll be ready to send and receive money in minutes.",
  "sources": ["faq_002"],
  "latency_ms": 1247
}
```

---

## Query Example 2: Supported Countries

```bash
curl -X POST http://localhost:3000/query \
  -H "Content-Type: application/json" \
  -d "{\"question\": \"Which countries does Beem support?\", \"top_k\": 2}"
```

**Response:**
```json
{
  "answer": "Beem currently operates in 15 African countries including Kenya, Uganda, Nigeria, Tanzania, Ghana, and Rwanda. We are expanding to more countries monthly.",
  "sources": ["faq_007"],
  "latency_ms": 1156
}
```

---

## Query Example 3: Transaction Fees

```bash
curl -X POST http://localhost:3000/query \
  -H "Content-Type: application/json" \
  -d "{\"question\": \"What are the transaction fees?\", \"top_k\": 2}"
```

**Response:**
```json
{
  "answer": "Beem offers competitive fees starting at 0.5% per transaction. Fees vary based on transaction type and amount. Premium members enjoy reduced fees and faster processing times.",
  "sources": ["faq_003"],
  "latency_ms": 1089
}
```

---

## Query Example 4: Transfer Time

```bash
curl -X POST http://localhost:3000/query \
  -H "Content-Type: application/json" \
  -d "{\"question\": \"How long does a transfer take?\", \"top_k\": 2}"
```

**Response:**
```json
{
  "answer": "Most Beem transfers are processed instantly. For international transfers, processing typically takes 1-3 business days depending on the destination country and receiving bank.",
  "sources": ["faq_004"],
  "latency_ms": 1123
}
```

---

## Query Example 5: Security

```bash
curl -X POST http://localhost:3000/query \
  -H "Content-Type: application/json" \
  -d "{\"question\": \"Is my money safe with Beem?\", \"top_k\": 2}"
```

**Response:**
```json
{
  "answer": "Yes, Beem uses bank-level encryption and multi-factor authentication to protect your account. All transactions are monitored for fraud and your funds are insured up to $100,000.",
  "sources": ["faq_005"],
  "latency_ms": 1234
}
```

---

## Query Example 6: Out-of-scope Question (Hallucination Prevention)

```bash
curl -X POST http://localhost:3000/query \
  -H "Content-Type: application/json" \
  -d "{\"question\": \"What is the capital of France?\", \"top_k\": 2}"
```

**Response:**
```json
{
  "answer": "I don't have enough information.",
  "sources": [],
  "latency_ms": 2145
}
```

---

## Query Example 7: With custom top_k

```bash
curl -X POST http://localhost:3000/query \
  -H "Content-Type: application/json" \
  -d "{\"question\": \"Tell me about transfers\", \"top_k\": 5}"
```

---

## Testing Idempotency

Call ingest multiple times - no duplicates should be created:

```bash
# First call
curl -X POST http://localhost:3000/ingest

# Second call - should skip all documents
curl -X POST http://localhost:3000/ingest

# Third call - should still skip all documents
curl -X POST http://localhost:3000/ingest
```

All three calls should return `"total_documents": 10`

---

## Error Examples

### Invalid query (missing question)

```bash
curl -X POST http://localhost:3000/query \
  -H "Content-Type: application/json" \
  -d "{\"top_k\": 3}"
```

**Response:**
```json
{
  "error": "question field is required and must be a string"
}
```

### Invalid top_k

```bash
curl -X POST http://localhost:3000/query \
  -H "Content-Type: application/json" \
  -d "{\"question\": \"test\", \"top_k\": 0}"
```

**Response:**
```json
{
  "error": "top_k must be greater than 0"
}
```

---

## Using PowerShell on Windows

If using PowerShell, use this syntax:

```powershell
$body = @{
    question = "How do I create an account?"
    top_k = 3
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/query" `
  -Method Post `
  -Headers @{"Content-Type"="application/json"} `
  -Body $body
```

Or for health check:

```powershell
Invoke-RestMethod -Uri "http://localhost:3000/health" -Method Get
```

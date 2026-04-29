#!/bin/bash

# Example API calls for testing the RAG microservice

API_URL="http://localhost:3000"

echo "Testing RAG Microservice..."
echo ""

# Health check
echo "1️⃣  Health Check"
echo "curl -X GET $API_URL/health"
curl -X GET $API_URL/health
echo ""
echo ""

# Ingest FAQs
echo "2️⃣  Ingesting FAQ Data"
echo "curl -X POST $API_URL/ingest"
curl -X POST $API_URL/ingest -H "Content-Type: application/json"
echo ""
echo ""

# Query examples
echo "3️⃣  Query Examples"
echo ""

echo "Query 1: How do I create an account?"
curl -X POST $API_URL/query \
  -H "Content-Type: application/json" \
  -d '{"question": "How do I create an account?", "top_k": 3}' | jq .
echo ""
echo ""

echo "Query 2: What countries are supported?"
curl -X POST $API_URL/query \
  -H "Content-Type: application/json" \
  -d '{"question": "Which countries does Beem support?", "top_k": 2}' | jq .
echo ""
echo ""

echo "Query 3: How much does it cost?"
curl -X POST $API_URL/query \
  -H "Content-Type: application/json" \
  -d '{"question": "What are the transaction fees?", "top_k": 2}' | jq .
echo ""
echo ""

echo "Query 4: Out-of-scope question"
curl -X POST $API_URL/query \
  -H "Content-Type: application/json" \
  -d '{"question": "What is the capital of France?", "top_k": 2}' | jq .
echo ""
echo ""

echo "✅ Test complete!"

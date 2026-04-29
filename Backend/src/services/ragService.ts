import { VectorStore, StoredDocument } from './vectorStore';
import { generateEmbedding, generateResponse } from './embedding';

export interface QueryResult {
  answer: string;
  sources: Array<{
    id: string;
    question: string;
    answer: string;
    category: string;
    score: number;
  }>;
  latency_ms: number;
}

export class RAGService {
  private vectorStore: VectorStore;

  constructor() {
    this.vectorStore = new VectorStore();
  }

  /**
   * Ingest FAQ data into the vector store
   */
  async ingestFAQ(
    faqId: string,
    question: string,
    answer: string,
    category: string
  ): Promise<void> {
    // Check for idempotency - if already exists, skip
    if (this.vectorStore.hasDocument(faqId)) {
      console.log(`Document ${faqId} already exists, skipping...`);
      return;
    }

    // Combine question and answer
    const combinedText = `Q: ${question}\nA: ${answer}`;

    // Generate embedding
    const embedding = await generateEmbedding(combinedText);

    // Store document
    const document: StoredDocument = {
      id: faqId,
      question,
      answer,
      text: combinedText,
      embedding,
      category,
    };

    this.vectorStore.addDocument(document);
    console.log(`Ingested: ${faqId}`);
  }

  /**
   * Process a query and return RAG response
   */
  async query(question: string, topK: number = 3): Promise<QueryResult> {
    const startTime = performance.now();

    try {
      // Generate embedding for the query
      const queryEmbedding = await generateEmbedding(question);

      // Retrieve all documents and compute similarity scores
      const allDocuments = this.vectorStore.getAllDocuments();
      console.log(`allDocuments count: ${allDocuments.length}`);

      if (allDocuments.length === 0) {
        return {
          answer: "I don't have enough information.",
          sources: [],
          latency_ms: Math.round(performance.now() - startTime),
        };
      }

      // Compute similarities and sort
      const scoredDocuments = this.vectorStore.searchByEmbedding(
        queryEmbedding,
        topK
      );

      // Extract top-k documents
      const retrievedDocs = scoredDocuments.map((item) => item.document);

      // Build context for LLM
      const contextText = retrievedDocs
        .map((doc) => `[${doc.id}] ${doc.text}`)
        .join('\n\n---\n\n');

      const systemPrompt = `You are a support assistant for Beem.
Answer ONLY using the provided context.
Do not make up information.
If the answer cannot be found in the context, respond: "I don't have enough information."`;

      const userPrompt = `CONTEXT:
${contextText}

USER QUESTION:
${question}`;

      // Generate response using LLM
      const answer = await generateResponse(systemPrompt, userPrompt);

      const latencyMs = Math.round(performance.now() - startTime);

      return {
        answer,
        sources: scoredDocuments.map(({ document, score }) => ({
          id: document.id,
          question: document.question,
          answer: document.answer,
          category: document.category,
          score,
        })),
        latency_ms: latencyMs,
      };
    } catch (error) {
      const latencyMs = Math.round(performance.now() - startTime);
      throw new Error(
        `Query failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Get document count
   */
  getDocumentCount(): number {
    return this.vectorStore.getDocumentCount();
  }
}

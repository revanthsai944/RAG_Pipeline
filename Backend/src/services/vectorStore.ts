/**
 * In-memory vector store for storing FAQ embeddings
 */

import { cosineSimilarity } from '../utils/similarity';

export interface StoredDocument {
  id: string;
  question: string;
  answer: string;
  text: string;
  embedding: number[];
  category: string;
}

export interface VectorSearchResult {
  document: StoredDocument;
  score: number;
}

export class VectorStore {
  private documents: Map<string, StoredDocument> = new Map();

  /**
   * Add or update a document in the store
   */
  addDocument(doc: StoredDocument): void {
    if (doc.embedding.length === 0) {
      throw new Error(`Document ${doc.id} is missing an embedding`);
    }

    this.documents.set(doc.id, doc);
  }

  /**
   * Get all documents
   */
  getAllDocuments(): StoredDocument[] {
    return Array.from(this.documents.values());
  }

  /**
   * Get a document by ID
   */
  getDocument(id: string): StoredDocument | undefined {
    return this.documents.get(id);
  }

  /**
   * Check if document exists
   */
  hasDocument(id: string): boolean {
    return this.documents.has(id);
  }

  /**
   * Get document count
   */
  getDocumentCount(): number {
    return this.documents.size;
  }

  /**
   * Search the store with a raw text embedding
   */
  searchByEmbedding(
    queryEmbedding: number[],
    topK: number = 3,
    category?: string
  ): VectorSearchResult[] {
    if (queryEmbedding.length === 0) {
      return [];
    }

    return this.getAllDocuments()
      .filter((doc) => !category || doc.category === category)
      .map((document) => ({
        document,
        score: cosineSimilarity(queryEmbedding, document.embedding),
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, Math.max(0, topK));
  }

  /**
   * Convenience helper for search results without scores
   */
  search(
    queryEmbedding: number[],
    topK: number = 3,
    category?: string
  ): StoredDocument[] {
    return this.searchByEmbedding(queryEmbedding, topK, category).map(
      (result) => result.document
    );
  }

  /**
   * Clear all documents
   */
  clear(): void {
    this.documents.clear();
  }
}

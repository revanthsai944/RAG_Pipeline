import { RAGService } from './ragService';

// Share one in-memory store across all routes in this process.
export const ragService = new RAGService();

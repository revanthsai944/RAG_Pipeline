import { Router, Request, Response } from 'express';
import { ragService } from '../services/ragServiceInstance';

const router = Router();

interface QueryRequest {
  question: string;
  top_k?: number;
}

/**
 * POST /query
 * Process a query and return RAG response
 */
router.post('/query', async (req: Request, res: Response): Promise<void> => {
  try {
    const { question, top_k = 3 } = req.body as QueryRequest;

    if (!question || typeof question !== 'string') {
      res.status(400).json({
        error: 'question field is required and must be a string',
      });
      return;
    }

    if (top_k < 1) {
      res.status(400).json({
        error: 'top_k must be greater than 0',
      });
      return;
    }

    const result = await ragService.query(question, top_k);

    res.status(200).json(result);
  } catch (error) {
    console.error('Query error:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Internal server error',
    });
  }
});

export { router as queryRouter };

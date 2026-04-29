import { Router, Request, Response } from 'express';
import * as fs from 'fs';
import * as path from 'path';
import { ragService } from '../services/ragServiceInstance';

const router = Router();

interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
}

/**
 * POST /ingest
 * Load FAQ JSON and ingest into vector store
 */
router.post('/ingest', async (req: Request, res: Response): Promise<void> => {
  try {
    const faqPath = path.join(process.cwd(), 'data', 'beem_faqs.json');

    if (!fs.existsSync(faqPath)) {
      res.status(400).json({
        error: 'FAQ file not found',
        path: faqPath,
      });
      return;
    }

    const faqData = fs.readFileSync(faqPath, 'utf-8');
    const faqs: FAQ[] = JSON.parse(faqData);

    if (!Array.isArray(faqs)) {
      res.status(400).json({
        error: 'FAQ data must be an array',
      });
      return;
    }

    let ingestedCount = 0;
    let skippedCount = 0;

    for (const faq of faqs) {
      if (!faq.id || !faq.question || !faq.answer || !faq.category) {
        console.warn(`Skipping incomplete FAQ:`, faq);
        skippedCount++;
        continue;
      }

      try {
        await ragService.ingestFAQ(
          faq.id,
          faq.question,
          faq.answer,
          faq.category
        );
        ingestedCount++;
      } catch (error) {
        console.error(`Error ingesting FAQ ${faq.id}:`, error);
        skippedCount++;
      }
    }

    res.status(200).json({
      message: 'Ingestion complete',
      ingested: ingestedCount,
      skipped: skippedCount,
      total_documents: ragService.getDocumentCount(),
    });
  } catch (error) {
    console.error('Ingest error:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Internal server error',
    });
  }
});

export { router as ingestRouter };

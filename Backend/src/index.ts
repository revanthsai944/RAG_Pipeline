import dotenv from 'dotenv';
dotenv.config();

import express, { NextFunction, Request, Response } from 'express';
import { dashboardRouter } from './routes/dashboard';
import { ingestRouter } from './routes/ingest';
import { queryRouter } from './routes/query';

const app = express();
const PORT = process.env.PORT || 3000;
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || 'http://localhost:5173';

app.use(express.json());
app.use((req: Request, res: Response, next: NextFunction) => {
  res.setHeader('Access-Control-Allow-Origin', FRONTEND_ORIGIN);
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.sendStatus(204);
    return;
  }

  next();
});

app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
});

app.use('/', dashboardRouter);
app.use('/', ingestRouter);
app.use('/', queryRouter);

app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: 'Endpoint not found',
  });
});

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal server error',
  });
});

app.listen(PORT, () => {
  console.log(`RAG Microservice running on http://localhost:${PORT}`);
  console.log(`Frontend origin allowed: ${FRONTEND_ORIGIN}`);
  console.log('POST /ingest - Load and ingest FAQs');
  console.log('POST /query - Query the RAG system');
  console.log('GET /health - Health check');
});

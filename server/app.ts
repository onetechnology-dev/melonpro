import express from 'express';
import cors from 'cors';
import path from 'path';
import { apiRouter } from './apiRouter.ts';

export const app = express();

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Serve static assets from public directory (e.g. /uploads)
app.use(express.static(path.resolve(process.cwd(), 'public')));

// Mount API routes
app.use('/api', apiRouter);

// Fallback error handler
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[API Error]', err);
  res.status(500).json({ error: err?.message || 'Internal server error' });
});

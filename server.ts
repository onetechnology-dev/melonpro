import express from 'express';
import path from 'path';
import { app } from './server/app.ts';
import { seedDatabaseIfEmpty } from './server/seed.ts';

const PORT = parseInt(process.env.PORT || '3000', 10);
const distDir = path.resolve(import.meta.dirname, 'dist');

// Serve static frontend assets if built
app.use(express.static(distDir));

app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) {
    return next();
  }
  res.sendFile(path.join(distDir, 'index.html'), (err) => {
    if (err) {
      res.status(404).send('Not Found. Build the client using npm run build first.');
    }
  });
});

async function startServer() {
  await seedDatabaseIfEmpty();
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[MelonPro Server] Running on http://localhost:${PORT}`);
    console.log(`[MelonPro Server] API available at http://localhost:${PORT}/api/health`);
    console.log(`[MelonPro Server] Database: melonpro_v1 on 127.0.0.1`);
  });
}

startServer().catch((err) => {
  console.error('[MelonPro Server] Failed to start:', err);
});

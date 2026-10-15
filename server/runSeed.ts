import { seedDatabaseIfEmpty } from './seed';
import { pool } from './db';

seedDatabaseIfEmpty()
  .then(() => {
    console.log('[MelonPro DB] Seeding completed.');
    return pool.end();
  })
  .catch((err) => {
    console.error('[MelonPro DB] Seed failed:', err);
    process.exit(1);
  });

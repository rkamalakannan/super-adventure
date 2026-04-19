import express from 'express';
import cors from 'cors';
import { getAppConfig } from './config/env';
import { testConnection } from './db';
import { startScheduler } from './services/schedulerService';
import authRoutes from './routes/auth';
import routesRoutes from './routes/routes';
import pricesRoutes from './routes/prices';

const app = express();

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/routes', routesRoutes);
app.use('/api/routes', pricesRoutes);

app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('[SERVER] Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

async function main() {
  const config = getAppConfig();
  
  console.log('[SERVER] Testing database connection...');
  const dbConnected = await testConnection();
  
  if (!dbConnected) {
    console.error('[SERVER] Database connection failed, exiting...');
    process.exit(1);
  }
  
  startScheduler();
  
  app.listen(config.port, () => {
    console.log(`[SERVER] TrainTracker API running on port ${config.port}`);
  });
}

main().catch((error) => {
  console.error('[SERVER] Failed to start:', error);
  process.exit(1);
});
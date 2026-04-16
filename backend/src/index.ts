import express, { Application } from 'express';
import cors from 'cors';
import { config } from './config/env';
import { logger } from './utils/logger';
import { pool_routes } from './routes/pools';
import { token_routes } from './routes/tokens';
import { position_routes } from './routes/positions';
import { transaction_routes } from './routes/transactions';
import dashboardRoutes from './routes/dashboard';

const app: Application = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/pools', pool_routes);
app.use('/api/tokens', token_routes);
app.use('/api/positions', position_routes);
app.use('/api/transactions', transaction_routes);
app.use('/api/dashboard', dashboardRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(config.port, () => {
  logger.info(`Server running on port ${config.port}`);
  logger.info(`Environment: ${config.nodeEnv}`);
});

export default app;

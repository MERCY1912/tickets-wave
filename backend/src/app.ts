import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import 'express-async-errors';
import { ticketRoutes } from './routes/ticket.routes.js';
import { activityRoutes } from './routes/activity.routes.js';
import { reminderRoutes } from './routes/reminder.routes.js';
import { aiRoutes } from './routes/ai.routes.js';
import { settingsRoutes } from './routes/settings.routes.js';
import { errorHandler } from './middleware/errorHandler.js';

export function createApp(): Express {
  const app = express();

  // Middleware
  app.use(cors({
    origin: '*',
    credentials: true,
  }));
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));

  // Health check
  app.get('/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // API Routes
  app.use('/api/tickets', ticketRoutes);
  app.use('/api/activities', activityRoutes);
  app.use('/api/reminders', reminderRoutes);
  app.use('/api/ai', aiRoutes);
  app.use('/api/settings', settingsRoutes);

  // 404 handler
  app.use((_req: Request, res: Response) => {
    res.status(404).json({ error: 'Not found' });
  });

  // Error handler
  app.use(errorHandler);

  return app;
}

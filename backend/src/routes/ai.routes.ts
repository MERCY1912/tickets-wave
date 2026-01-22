import { Router, Response } from 'express';
import { prisma } from '../utils/db.js';
import { getAIService, resetAIService } from '../services/ai.service.js';
import { authenticateToken, AuthRequest } from '../middleware/auth.js';
import { chatSchema, analyzeTicketsSchema, testAIConnectionSchema } from '../utils/validation.js';

export const aiRoutes = Router();

// GET /api/ai/status - Check AI service status
aiRoutes.get('/status', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.userId!;
  const aiService = getAIService(userId);

  // Get user's settings for DeepSeek configuration
  const settings = await prisma.settings.findFirst({
    where: { userId },
  });

  const status = await aiService.checkHealth(settings);

  res.json(status);
});

// GET /api/ai/models - List available models
aiRoutes.get('/models', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.userId!;
  const aiService = getAIService(userId);

  try {
    const models = await aiService.listModels();
    res.json({ models });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to list models',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// POST /api/ai/chat - Chat with AI
aiRoutes.post('/chat', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.userId!;
  const data = chatSchema.parse(req.body);

  const aiService = getAIService(userId);

  try {
    const result = await aiService.chat({
      message: data.message,
      context: data.context,
      userId,
    });

    res.json(result);
  } catch (error) {
    res.status(500).json({
      error: 'Chat failed',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// POST /api/ai/tickets/:id/summary - Generate ticket summary
aiRoutes.post('/tickets/:id/summary', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.userId!;
  const ticketId = req.params.id;

  // Verify ticket belongs to user
  const ticket = await prisma.ticket.findFirst({
    where: { id: ticketId, userId },
  });

  if (!ticket) {
    res.status(404).json({ error: 'Ticket not found' });
    return;
  }

  const aiService = getAIService(userId);

  try {
    const result = await aiService.summarizeTicket(ticketId, userId);
    res.json(result);
  } catch (error) {
    res.status(500).json({
      error: 'Failed to generate summary',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// POST /api/ai/tickets/:id/suggestions - Generate ticket suggestions
aiRoutes.post('/tickets/:id/suggestions', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.userId!;
  const ticketId = req.params.id;

  // Verify ticket belongs to user
  const ticket = await prisma.ticket.findFirst({
    where: { id: ticketId, userId },
  });

  if (!ticket) {
    res.status(404).json({ error: 'Ticket not found' });
    return;
  }

  const aiService = getAIService(userId);

  try {
    const result = await aiService.generateSuggestions(ticketId, userId);
    res.json(result);
  } catch (error) {
    res.status(500).json({
      error: 'Failed to generate suggestions',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// POST /api/ai/analyze - Analyze tickets
aiRoutes.post('/analyze', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.userId!;
  const data = analyzeTicketsSchema.parse(req.body);

  const aiService = getAIService(userId);

  try {
    const result = await aiService.analyzeTickets(data.ticketIds, userId);
    res.json(result);
  } catch (error) {
    res.status(500).json({
      error: 'Analysis failed',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// POST /api/ai/daily-briefing - Generate daily briefing
aiRoutes.post('/daily-briefing', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.userId!;
  const aiService = getAIService(userId);

  try {
    const result = await aiService.dailyBriefing(userId);
    res.json(result);
  } catch (error) {
    res.status(500).json({
      error: 'Failed to generate daily briefing',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// POST /api/ai/test-connection - Test DeepSeek connection
aiRoutes.post('/test-connection', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.userId!;
  const data = testAIConnectionSchema.parse(req.body);

  const aiService = resetAIService(userId);

  try {
    const result = await aiService.testConnection(data.apiKey);
    res.json(result);
  } catch (error) {
    res.status(500).json({
      error: 'Connection test failed',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

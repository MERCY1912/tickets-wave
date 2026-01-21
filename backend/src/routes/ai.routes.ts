import { Router, Request, Response } from 'express';
import { getAIService, resetAIService } from '../services/ai.service.js';
import { chatSchema, analyzeTicketsSchema, testOllamaSchema } from '../utils/validation.js';

export const aiRoutes = Router();

// GET /api/ai/status - Check AI service status
aiRoutes.get('/status', async (_req: Request, res: Response) => {
  const aiService = getAIService();
  const status = await aiService.checkHealth();

  res.json(status);
});

// GET /api/ai/models - List available models
aiRoutes.get('/models', async (_req: Request, res: Response) => {
  const aiService = getAIService();

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
aiRoutes.post('/chat', async (req: Request, res: Response) => {
  const data = chatSchema.parse(req.body);

  const aiService = getAIService();

  try {
    const result = await aiService.chat({
      message: data.message,
      context: data.context,
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
aiRoutes.post('/tickets/:id/summary', async (req: Request, res: Response) => {
  const ticketId = req.params.id;

  const aiService = getAIService();

  try {
    const result = await aiService.summarizeTicket(ticketId);
    res.json(result);
  } catch (error) {
    res.status(500).json({
      error: 'Failed to generate summary',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// POST /api/ai/tickets/:id/suggestions - Generate ticket suggestions
aiRoutes.post('/tickets/:id/suggestions', async (req: Request, res: Response) => {
  const ticketId = req.params.id;

  const aiService = getAIService();

  try {
    const result = await aiService.generateSuggestions(ticketId);
    res.json(result);
  } catch (error) {
    res.status(500).json({
      error: 'Failed to generate suggestions',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// POST /api/ai/analyze - Analyze tickets
aiRoutes.post('/analyze', async (req: Request, res: Response) => {
  const data = analyzeTicketsSchema.parse(req.body);

  const aiService = getAIService();

  try {
    const result = await aiService.analyzeTickets(data.ticketIds);
    res.json(result);
  } catch (error) {
    res.status(500).json({
      error: 'Analysis failed',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// POST /api/ai/daily-briefing - Generate daily briefing
aiRoutes.post('/daily-briefing', async (_req: Request, res: Response) => {
  const aiService = getAIService();

  try {
    const result = await aiService.dailyBriefing();
    res.json(result);
  } catch (error) {
    res.status(500).json({
      error: 'Failed to generate daily briefing',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// POST /api/ai/test-connection - Test Ollama connection
aiRoutes.post('/test-connection', async (req: Request, res: Response) => {
  const data = testOllamaSchema.parse(req.body);

  const aiService = data.url ? resetAIService(data.url) : getAIService();

  try {
    const result = await aiService.testConnection(data.url);
    res.json(result);
  } catch (error) {
    res.status(500).json({
      error: 'Connection test failed',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

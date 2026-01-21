import { Router, Request, Response } from 'express';
import { prisma } from '../utils/db.js';
import { updateSettingsSchema, testOllamaSchema } from '../utils/validation.js';
import { resetAIService } from '../services/ai.service.js';

export const settingsRoutes = Router();

// GET /api/settings - Get settings
settingsRoutes.get('/', async (_req: Request, res: Response) => {
  let settings = await prisma.settings.findUnique({
    where: { id: 'singleton' },
  });

  // Create default settings if not exists
  if (!settings) {
    settings = await prisma.settings.create({
      data: {
        id: 'singleton',
        ollamaUrl: 'http://localhost:11434',
        ollamaModel: 'qwen2.5:7b',
        ollamaTemperature: 0.7,
        reminderStagnantDays: 5,
        reminderWaitingClientDays: 3,
        reminderHighPriorityDays: 2,
        reminderOldTicketDays: 14,
        aiAnalysisInterval: 4,
        theme: 'dark',
      },
    });
  }

  res.json(settings);
});

// PUT /api/settings - Update settings
settingsRoutes.put('/', async (req: Request, res: Response) => {
  const data = updateSettingsSchema.parse(req.body);

  // Get current settings
  const current = await prisma.settings.findUnique({
    where: { id: 'singleton' },
  });

  if (!current) {
    res.status(404).json({ error: 'Settings not found' });
    return;
  }

  // Update settings
  const settings = await prisma.settings.update({
    where: { id: 'singleton' },
    data,
  });

  // Reset AI service if URL changed
  if (data.ollamaUrl && data.ollamaUrl !== current.ollamaUrl) {
    resetAIService(data.ollamaUrl);
  }

  res.json(settings);
});

// POST /api/settings/ollama/test - Test Ollama connection
settingsRoutes.post('/ollama/test', async (req: Request, res: Response) => {
  const data = testOllamaSchema.parse(req.body);

  const testUrl = data.url || 'http://localhost:11434';

  try {
    const response = await fetch(`${testUrl}/api/tags`, {
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) {
      return res.status(400).json({
        success: false,
        error: `Ollama returned status ${response.status}`,
      });
    }

    const responseData = await response.json() as { models?: Array<{ name: string }> };

    return res.json({
      success: true,
      models: responseData.models?.map((m) => m.name) || [],
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Connection failed',
    });
  }
});

// GET /api/settings/ollama/models - List Ollama models
settingsRoutes.get('/ollama/models', async (_req: Request, res: Response) => {
  const settings = await prisma.settings.findUnique({
    where: { id: 'singleton' },
  });

  const ollamaUrl = settings?.ollamaUrl || 'http://localhost:11434';

  try {
    const response = await fetch(`${ollamaUrl}/api/tags`, {
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) {
      return res.status(400).json({
        error: `Ollama returned status ${response.status}`,
      });
    }

    const responseData = await response.json() as { models?: Array<{ name: string }> };

    return res.json({
      models: responseData.models?.map((m) => m.name) || [],
    });
  } catch (error) {
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to fetch models',
    });
  }
});

// DELETE /api/settings - Reset settings to defaults
settingsRoutes.delete('/', async (_req: Request, res: Response) => {
  const settings = await prisma.settings.update({
    where: { id: 'singleton' },
    data: {
      ollamaUrl: 'http://localhost:11434',
      ollamaModel: 'qwen2.5:7b',
      ollamaTemperature: 0.7,
      aiSystemPrompt: null,
      reminderStagnantDays: 5,
      reminderWaitingClientDays: 3,
      reminderHighPriorityDays: 2,
      reminderOldTicketDays: 14,
      aiAnalysisInterval: 4,
      theme: 'dark',
    },
  });

  // Reset AI service
  resetAIService(settings.ollamaUrl);

  res.json(settings);
});

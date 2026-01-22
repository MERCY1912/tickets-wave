import { Router, Response } from 'express';
import { prisma } from '../utils/db.js';
import { authenticateToken, AuthRequest } from '../middleware/auth.js';
import { updateSettingsSchema, testAIConnectionSchema } from '../utils/validation.js';
import { resetAIService } from '../services/ai.service.js';

export const settingsRoutes = Router();

// GET /api/settings - Get settings
settingsRoutes.get('/', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.userId!;
  let settings = await prisma.settings.findFirst({
    where: { userId },
  });

  // Create default settings if not exists
  if (!settings) {
    settings = await prisma.settings.create({
      data: {
        userId,
        deepseekModel: 'deepseek-chat',
        deepseekTemperature: 0.7,
        reminderStagnantDays: 5,
        reminderWaitingClientDays: 3,
        reminderHighPriorityDays: 2,
        reminderOldTicketDays: 14,
        aiAnalysisInterval: 4,
        theme: 'dark',
      },
    });
  }

  // Don't expose the API key in the response
  const { deepseekApiKey, ...settingsWithoutKey } = settings;

  res.json({
    ...settingsWithoutKey,
    hasApiKey: !!settings.deepseekApiKey,
  });
});

// PUT /api/settings - Update settings
settingsRoutes.put('/', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.userId!;
  const data = updateSettingsSchema.parse(req.body);

  // Get current settings
  const current = await prisma.settings.findFirst({
    where: { userId },
  });

  if (!current) {
    res.status(404).json({ error: 'Settings not found' });
    return;
  }

  // Update settings
  const settings = await prisma.settings.update({
    where: { id: current.id },
    data,
  });

  // Reset AI service if API key changed
  if (data.deepseekApiKey && data.deepseekApiKey !== current.deepseekApiKey) {
    resetAIService(userId);
  }

  // Don't expose the API key in the response
  const { deepseekApiKey, ...settingsWithoutKey } = settings;

  res.json({
    ...settingsWithoutKey,
    hasApiKey: !!settings.deepseekApiKey,
  });
});

// POST /api/settings/ai/test - Test DeepSeek connection
settingsRoutes.post('/ai/test', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  const data = testAIConnectionSchema.parse(req.body);

  try {
    const response = await fetch('https://api.deepseek.com/v1/models', {
      headers: {
        'Authorization': `Bearer ${data.apiKey}`,
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      res.status(400).json({
        success: false,
        error: `DeepSeek returned status ${response.status}`,
      });
      return;
    }

    const responseData = await response.json() as { data?: Array<{ id: string }> };

    res.json({
      success: true,
      models: responseData.data?.map((m) => m.id) || [],
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Connection failed',
    });
  }
});

// GET /api/settings/ai/models - List DeepSeek models
settingsRoutes.get('/ai/models', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.userId!;

  const settings = await prisma.settings.findFirst({
    where: { userId },
  });

  const apiKey = settings?.deepseekApiKey || process.env.DEEPSEEK_API_KEY;

  if (!apiKey) {
    res.status(400).json({
      error: 'DeepSeek API key not configured',
    });
    return;
  }

  try {
    const response = await fetch('https://api.deepseek.com/v1/models', {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      res.status(400).json({
        error: `DeepSeek returned status ${response.status}`,
      });
      return;
    }

    const responseData = await response.json() as { data?: Array<{ id: string }> };

    res.json({
      models: responseData.data?.map((m) => m.id) || [],
    });
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to fetch models',
    });
  }
});

// DELETE /api/settings - Reset settings to defaults
settingsRoutes.delete('/', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.userId!;

  const current = await prisma.settings.findFirst({
    where: { userId },
  });

  if (!current) {
    res.status(404).json({ error: 'Settings not found' });
    return;
  }

  const settings = await prisma.settings.update({
    where: { id: current.id },
    data: {
      deepseekModel: 'deepseek-chat',
      deepseekTemperature: 0.7,
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
  resetAIService(userId);

  // Don't expose the API key in the response
  const { deepseekApiKey, ...settingsWithoutKey } = settings;

  res.json({
    ...settingsWithoutKey,
    hasApiKey: !!settings.deepseekApiKey,
  });
});

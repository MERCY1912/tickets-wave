import { prisma } from '../../src/lib/db';
import { authenticateRequest, unauthorizedResponse, errorResponse, jsonResponse } from '../../src/lib/auth';
import { updateSettingsSchema } from '../../src/lib/validation';

// GET /api/settings - Get settings
// PUT /api/settings - Update settings
// DELETE /api/settings - Reset settings to defaults

export async function GET(req: Request): Promise<Response> {
  const auth = await authenticateRequest(req);
  if (!auth) {
    return unauthorizedResponse();
  }

  try {
    let settings = await prisma.settings.findFirst({
      where: { userId: auth.userId },
    });

    // Create default settings if not exists
    if (!settings) {
      settings = await prisma.settings.create({
        data: {
          userId: auth.userId,
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

    return jsonResponse({
      ...settingsWithoutKey,
      hasApiKey: !!settings.deepseekApiKey,
    });
  } catch (error: any) {
    console.error('[GET /api/settings] Error:', error);
    return errorResponse(error instanceof Error ? error.message : 'Unknown error', 500);
  }
}

export async function PUT(req: Request): Promise<Response> {
  const auth = await authenticateRequest(req);
  if (!auth) {
    return unauthorizedResponse();
  }

  try {
    const data = updateSettingsSchema.parse(await req.json());

    // Get current settings
    const current = await prisma.settings.findFirst({
      where: { userId: auth.userId },
    });

    if (!current) {
      return errorResponse('Settings not found', 404);
    }

    // Update settings
    const settings = await prisma.settings.update({
      where: { id: current.id },
      data,
    });

    // Note: AI service reset is handled on the frontend by re-initializing

    // Don't expose the API key in the response
    const { deepseekApiKey, ...settingsWithoutKey } = settings;

    return jsonResponse({
      ...settingsWithoutKey,
      hasApiKey: !!settings.deepseekApiKey,
    });
  } catch (error: any) {
    console.error('[PUT /api/settings] Error:', error);
    if (error.name === 'ZodError') {
      return errorResponse('Validation error: ' + JSON.stringify(error.errors), 400);
    }
    return errorResponse(error instanceof Error ? error.message : 'Unknown error', 500);
  }
}

export async function DELETE(req: Request): Promise<Response> {
  const auth = await authenticateRequest(req);
  if (!auth) {
    return unauthorizedResponse();
  }

  try {
    const current = await prisma.settings.findFirst({
      where: { userId: auth.userId },
    });

    if (!current) {
      return errorResponse('Settings not found', 404);
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

    // Don't expose the API key in the response
    const { deepseekApiKey, ...settingsWithoutKey } = settings;

    return jsonResponse({
      ...settingsWithoutKey,
      hasApiKey: !!settings.deepseekApiKey,
    });
  } catch (error: any) {
    console.error('[DELETE /api/settings] Error:', error);
    return errorResponse(error instanceof Error ? error.message : 'Unknown error', 500);
  }
}

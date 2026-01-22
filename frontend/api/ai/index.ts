import { authenticateRequest, unauthorizedResponse, errorResponse, jsonResponse } from '../../src/lib/auth';
import { chat, getAISettings, getAIClient } from '../../src/lib/ai.service';
import { chatSchema } from '../../src/lib/validation';

// GET /api/ai - Check AI service status
// POST /api/ai - Chat with AI

export async function GET(req: Request): Promise<Response> {
  const auth = await authenticateRequest(req);
  if (!auth) {
    return unauthorizedResponse();
  }

  try {
    const settings = await getAISettings(auth.userId);

    if (!settings.deepseekApiKey) {
      return jsonResponse({ healthy: false, error: 'DeepSeek API key not configured' });
    }

    const client = await getAIClient(auth.userId);
    const healthy = await client.checkHealth();

    if (!healthy) {
      return jsonResponse({ healthy: false, error: 'DeepSeek API is not responding' });
    }

    const models = await client.listModels();
    return jsonResponse({ healthy: true, models });
  } catch (error: any) {
    console.error('[GET /api/ai] Error:', error);
    return jsonResponse({
      healthy: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

export async function POST(req: Request): Promise<Response> {
  const auth = await authenticateRequest(req);
  if (!auth) {
    return unauthorizedResponse();
  }

  try {
    const data = chatSchema.parse(await req.json());

    const result = await chat({
      message: data.message,
      context: data.context,
      userId: auth.userId,
    });

    return jsonResponse(result);
  } catch (error: any) {
    console.error('[POST /api/ai] Error:', error);
    if (error.name === 'ZodError') {
      return errorResponse('Validation error: ' + JSON.stringify(error.errors), 400);
    }
    return errorResponse(error instanceof Error ? error.message : 'Unknown error', 500);
  }
}

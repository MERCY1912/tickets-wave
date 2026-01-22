import { authenticateRequest, unauthorizedResponse, jsonResponse } from '../../../src/lib/auth';
import { getAISettings, getAIClient } from '../../../src/lib/ai.service';

// GET /api/ai/status - Check AI service status

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
    console.error('[GET /api/ai/status] Error:', error);
    return jsonResponse({
      healthy: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

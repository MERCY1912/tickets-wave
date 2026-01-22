import { authenticateRequest, unauthorizedResponse, errorResponse, jsonResponse } from '../../../src/lib/auth';
import { getAIClient } from '../../../src/lib/ai.service';
import { testAIConnectionSchema } from '../../../src/lib/validation';

// POST /api/ai/test-connection - Test DeepSeek connection

export async function POST(req: Request): Promise<Response> {
  const auth = await authenticateRequest(req);
  if (!auth) {
    return unauthorizedResponse();
  }

  try {
    const data = testAIConnectionSchema.parse(await req.json());

    const key = data.apiKey || process.env.DEEPSEEK_API_KEY;

    if (!key) {
      return jsonResponse({ success: false, error: 'DeepSeek API key not provided' });
    }

    const { createDeepSeekClient } = await import('../../../src/lib/deepseek');
    const client = createDeepSeekClient(key);
    const healthy = await client.checkHealth();

    if (!healthy) {
      return jsonResponse({ success: false, error: 'Connection failed' });
    }

    const models = await client.listModels();
    return jsonResponse({ success: true, models });
  } catch (error: any) {
    console.error('[POST /api/ai/test-connection] Error:', error);
    return jsonResponse({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

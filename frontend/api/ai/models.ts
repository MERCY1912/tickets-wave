import { authenticateRequest, unauthorizedResponse, errorResponse, jsonResponse } from '../../../src/lib/auth';
import { getAIClient } from '../../../src/lib/ai.service';

// GET /api/ai/models - List available models

export async function GET(req: Request): Promise<Response> {
  const auth = await authenticateRequest(req);
  if (!auth) {
    return unauthorizedResponse();
  }

  try {
    const client = await getAIClient(auth.userId);
    const models = await client.listModels();
    return jsonResponse({ models });
  } catch (error: any) {
    console.error('[GET /api/ai/models] Error:', error);
    return errorResponse(error instanceof Error ? error.message : 'Failed to list models', 500);
  }
}

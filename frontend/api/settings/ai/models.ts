import { prisma } from '../../../../src/lib/db';
import { authenticateRequest, unauthorizedResponse, errorResponse, jsonResponse } from '../../../../src/lib/auth';

// GET /api/settings/ai/models - List DeepSeek models

export async function GET(req: Request): Promise<Response> {
  const auth = await authenticateRequest(req);
  if (!auth) {
    return unauthorizedResponse();
  }

  try {
    const settings = await prisma.settings.findFirst({
      where: { userId: auth.userId },
    });

    const apiKey = settings?.deepseekApiKey || process.env.DEEPSEEK_API_KEY;

    if (!apiKey) {
      return errorResponse('DeepSeek API key not configured', 400);
    }

    const response = await fetch('https://api.deepseek.com/v1/models', {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      return errorResponse(`DeepSeek returned status ${response.status}`, 400);
    }

    const responseData = (await response.json()) as { data?: Array<{ id: string }> };

    return jsonResponse({
      models: responseData.data?.map((m) => m.id) || [],
    });
  } catch (error: any) {
    console.error('[GET /api/settings/ai/models] Error:', error);
    return errorResponse(error instanceof Error ? error.message : 'Failed to fetch models', 500);
  }
}

import { authenticateRequest, unauthorizedResponse, jsonResponse, errorResponse } from '../../../src/lib/auth';
import { testAIConnectionSchema } from '../../../src/lib/validation';

// POST /api/settings/ai/test - Test DeepSeek connection

export async function POST(req: Request): Promise<Response> {
  const auth = await authenticateRequest(req);
  if (!auth) {
    return unauthorizedResponse();
  }

  try {
    const data = testAIConnectionSchema.parse(await req.json());

    const response = await fetch('https://api.deepseek.com/v1/models', {
      headers: {
        Authorization: `Bearer ${data.apiKey}`,
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      return jsonResponse(
        {
          success: false,
          error: `DeepSeek returned status ${response.status}`,
        },
        400
      );
    }

    const responseData = (await response.json()) as { data?: Array<{ id: string }> };

    return jsonResponse({
      success: true,
      models: responseData.data?.map((m) => m.id) || [],
    });
  } catch (error: any) {
    console.error('[POST /api/settings/ai/test] Error:', error);
    return jsonResponse(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Connection failed',
      },
      500
    );
  }
}

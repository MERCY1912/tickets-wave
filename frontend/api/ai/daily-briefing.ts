import { authenticateRequest, unauthorizedResponse, errorResponse, jsonResponse } from '../../../src/lib/auth';
import { dailyBriefing } from '../../../src/lib/ai.service';

// POST /api/ai/daily-briefing - Generate daily briefing

export async function POST(req: Request): Promise<Response> {
  const auth = await authenticateRequest(req);
  if (!auth) {
    return unauthorizedResponse();
  }

  try {
    const result = await dailyBriefing(auth.userId);
    return jsonResponse(result);
  } catch (error: any) {
    console.error('[POST /api/ai/daily-briefing] Error:', error);
    return errorResponse(
      error instanceof Error ? error.message : 'Unknown error',
      500
    );
  }
}

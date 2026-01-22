import { authenticateRequest, unauthorizedResponse, errorResponse, jsonResponse } from '../../../src/lib/auth';
import { analyzeTickets } from '../../../src/lib/ai.service';
import { analyzeTicketsSchema } from '../../../src/lib/validation';

// POST /api/ai/analyze - Analyze tickets

export async function POST(req: Request): Promise<Response> {
  const auth = await authenticateRequest(req);
  if (!auth) {
    return unauthorizedResponse();
  }

  try {
    const data = analyzeTicketsSchema.parse(await req.json());

    const result = await analyzeTickets(data.ticketIds, auth.userId);
    return jsonResponse(result);
  } catch (error: any) {
    console.error('[POST /api/ai/analyze] Error:', error);
    if (error.name === 'ZodError') {
      return errorResponse('Validation error: ' + JSON.stringify(error.errors), 400);
    }
    return errorResponse(error instanceof Error ? error.message : 'Unknown error', 500);
  }
}

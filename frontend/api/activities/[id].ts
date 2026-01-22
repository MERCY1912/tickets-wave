import { prisma } from '../../../src/lib/db';
import { authenticateRequest, unauthorizedResponse, errorResponse, jsonResponse } from '../../../src/lib/auth';

// GET /api/activities/[id] - Get single activity
// DELETE /api/activities/[id] - Delete activity

interface Context {
  params: { id: string };
}

export async function GET(req: Request, context: Context): Promise<Response> {
  const auth = await authenticateRequest(req);
  if (!auth) {
    return unauthorizedResponse();
  }

  try {
    const activity = await prisma.ticketActivity.findFirst({
      where: { id: context.params.id, userId: auth.userId },
      include: {
        ticket: {
          select: {
            id: true,
            title: true,
            status: true,
          },
        },
      },
    });

    if (!activity) {
      return errorResponse('Activity not found', 404);
    }

    return jsonResponse(activity);
  } catch (error: any) {
    console.error('[GET /api/activities/:id] Error:', error);
    return errorResponse(error instanceof Error ? error.message : 'Unknown error', 500);
  }
}

export async function DELETE(req: Request, context: Context): Promise<Response> {
  const auth = await authenticateRequest(req);
  if (!auth) {
    return unauthorizedResponse();
  }

  try {
    const existing = await prisma.ticketActivity.findFirst({
      where: { id: context.params.id, userId: auth.userId },
    });

    if (!existing) {
      return errorResponse('Activity not found', 404);
    }

    await prisma.ticketActivity.delete({
      where: { id: context.params.id },
    });

    return jsonResponse({ success: true, message: 'Activity deleted' });
  } catch (error: any) {
    console.error('[DELETE /api/activities/:id] Error:', error);
    return errorResponse(error instanceof Error ? error.message : 'Unknown error', 500);
  }
}

import { prisma } from '../../src/lib/db';
import { authenticateRequest, unauthorizedResponse, jsonResponse } from '../../src/lib/auth';

// GET /api/todos/active - Get active (not completed) todos

export async function GET(req: Request): Promise<Response> {
  const auth = await authenticateRequest(req);
  if (!auth) {
    return unauthorizedResponse();
  }

  try {
    const todos = await prisma.todo.findMany({
      where: { completed: false, userId: auth.userId },
      include: {
        ticket: {
          select: {
            id: true,
            title: true,
            status: true,
            priority: true,
            tags: true,
          },
        },
      },
      orderBy: [{ priority: 'desc' }, { createdAt: 'asc' }],
    });

    return jsonResponse(todos);
  } catch (error: any) {
    console.error('[GET /api/todos/active] Error:', error);
    return jsonResponse({ error: error instanceof Error ? error.message : 'Unknown error' }, 500);
  }
}

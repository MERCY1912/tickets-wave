import { prisma } from '../../../../src/lib/db';
import { authenticateRequest, unauthorizedResponse, errorResponse, jsonResponse } from '../../../../src/lib/auth';
import { toggleTodoSchema } from '../../../../src/lib/validation';

// PATCH /api/todos/[id]/toggle - Toggle completion

interface Context {
  params: { id: string };
}

export async function PATCH(req: Request, context: Context): Promise<Response> {
  const auth = await authenticateRequest(req);
  if (!auth) {
    return unauthorizedResponse();
  }

  try {
    const { completed } = toggleTodoSchema.parse(await req.json());

    const existing = await prisma.todo.findFirst({
      where: { id: context.params.id, userId: auth.userId },
    });

    if (!existing) {
      return errorResponse('Todo not found', 404);
    }

    const todo = await prisma.todo.update({
      where: { id: context.params.id },
      data: {
        completed,
        completedAt: completed ? new Date() : null,
      },
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
    });

    return jsonResponse(todo);
  } catch (error: any) {
    console.error('[PATCH /api/todos/:id/toggle] Error:', error);
    if (error.name === 'ZodError') {
      return errorResponse('Validation error: ' + JSON.stringify(error.errors), 400);
    }
    return errorResponse(error instanceof Error ? error.message : 'Unknown error', 500);
  }
}

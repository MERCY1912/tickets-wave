import { prisma } from '../../../src/lib/db';
import { authenticateRequest, unauthorizedResponse, errorResponse, jsonResponse } from '../../../src/lib/auth';
import { updateTodoSchema, toggleTodoSchema } from '../../../src/lib/validation';

// GET /api/todos/[id] - Get single todo
// PUT /api/todos/[id] - Update todo
// DELETE /api/todos/[id] - Delete todo

interface Context {
  params: { id: string };
}

export async function GET(req: Request, context: Context): Promise<Response> {
  const auth = await authenticateRequest(req);
  if (!auth) {
    return unauthorizedResponse();
  }

  try {
    const todo = await prisma.todo.findFirst({
      where: { id: context.params.id, userId: auth.userId },
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

    if (!todo) {
      return errorResponse('Todo not found', 404);
    }

    return jsonResponse(todo);
  } catch (error: any) {
    console.error('[GET /api/todos/:id] Error:', error);
    return errorResponse(error instanceof Error ? error.message : 'Unknown error', 500);
  }
}

export async function PUT(req: Request, context: Context): Promise<Response> {
  const auth = await authenticateRequest(req);
  if (!auth) {
    return unauthorizedResponse();
  }

  try {
    const data = updateTodoSchema.parse(await req.json());

    const existing = await prisma.todo.findFirst({
      where: { id: context.params.id, userId: auth.userId },
    });

    if (!existing) {
      return errorResponse('Todo not found', 404);
    }

    const todo = await prisma.todo.update({
      where: { id: context.params.id },
      data,
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
    console.error('[PUT /api/todos/:id] Error:', error);
    if (error.name === 'ZodError') {
      return errorResponse('Validation error: ' + JSON.stringify(error.errors), 400);
    }
    return errorResponse(error instanceof Error ? error.message : 'Unknown error', 500);
  }
}

export async function DELETE(req: Request, context: Context): Promise<Response> {
  const auth = await authenticateRequest(req);
  if (!auth) {
    return unauthorizedResponse();
  }

  try {
    const existing = await prisma.todo.findFirst({
      where: { id: context.params.id, userId: auth.userId },
    });

    if (!existing) {
      return errorResponse('Todo not found', 404);
    }

    try {
      await prisma.todo.delete({ where: { id: context.params.id } });
    } catch (error: any) {
      if (error.code === 'P2025') {
        return new Response(null, { status: 204 });
      }
      throw error;
    }

    return new Response(null, { status: 204 });
  } catch (error: any) {
    console.error('[DELETE /api/todos/:id] Error:', error);
    return errorResponse(error instanceof Error ? error.message : 'Unknown error', 500);
  }
}

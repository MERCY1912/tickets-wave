import { prisma } from '../../src/lib/db';
import { authenticateRequest, unauthorizedResponse, errorResponse, jsonResponse } from '../../src/lib/auth';
import { createTodoSchema } from '../../src/lib/validation';

// Helper function to parse AI report and extract todos
function parseAIReportToTodos(report: string): Array<{
  title: string;
  description?: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  ticketId?: string;
}> {
  const todos: Array<{
    title: string;
    description?: string;
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    ticketId?: string;
  }> = [];

  const lines = report.split('\n').map((l) => l.trim()).filter((l) => l);
  let currentSection = '';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.includes('FOCUS TODAY') || line.includes('🎯')) {
      currentSection = 'focus';
      continue;
    } else if (line.includes('RISK ALERT') || line.includes('⚠️')) {
      currentSection = 'risk';
      continue;
    } else if (line.includes('RECOMMENDATIONS') || line.includes('💡')) {
      currentSection = 'recommendations';
      continue;
    } else if (line.startsWith('#')) {
      currentSection = '';
      continue;
    }

    if (currentSection === 'focus' && line.match(/^\d+\.\s+/)) {
      const priorityMatch = line.match(/\[(CRITICAL|HIGH|MEDIUM|LOW)\]/i);
      const priority = (priorityMatch?.[1]?.toUpperCase() || 'MEDIUM') as
        | 'LOW'
        | 'MEDIUM'
        | 'HIGH'
        | 'CRITICAL';

      const titleMatch = line.match(/\*\*([^*]+)\*\*/);
      const idMatch = line.match(/\(ID:\s*([a-f0-9-]+)\)/i);

      if (titleMatch) {
        const title = titleMatch[1].replace(/\[(CRITICAL|HIGH|MEDIUM|LOW)\]\s*/i, '').trim();
        const ticketId = idMatch?.[1];

        let description: string | undefined;
        if (i + 1 < lines.length && lines[i + 1].includes('**Action:**')) {
          description = lines[i + 1].replace(/\*\*Action:\*\*/i, '').trim();
        }

        todos.push({
          title: `[${priority}] ${title}`,
          description,
          priority,
          ticketId,
        });
      }
    }

    if (currentSection === 'risk' && line.startsWith('- **')) {
      const priorityMatch = line.match(/\[(CRITICAL|HIGH|MEDIUM|LOW)\]/i);
      const priority = (priorityMatch?.[1]?.toUpperCase() || 'HIGH') as
        | 'LOW'
        | 'MEDIUM'
        | 'HIGH'
        | 'CRITICAL';

      const titleMatch = line.match(/-?\s*\*\*([^*]+)\*\*/);
      const idMatch = line.match(/\(ID:\s*([a-f0-9-]+)\)/i);

      if (titleMatch) {
        const title = titleMatch[1].replace(/\[(CRITICAL|HIGH|MEDIUM|LOW)\]\s*/i, '').trim();
        const ticketId = idMatch?.[1];

        const riskMatch = line.match(/\*\*[^*]+\*\*\s*-\s*Risk:\s*(.+)/);
        const description = riskMatch?.[1];

        todos.push({
          title: `[RISK] ${title}`,
          description,
          priority,
          ticketId,
        });
      }
    }

    if (currentSection === 'recommendations' && line.startsWith('-')) {
      const recommendation = line.replace(/^-\s*/, '').trim();

      if (recommendation && !recommendation.startsWith('**')) {
        todos.push({
          title: recommendation,
          priority: 'MEDIUM',
        });
      }
    }

    if (line.toLowerCase().includes('action:') && !line.includes('**Action:**')) {
      const actionText = line.replace(/.*action:\s*/i, '').trim();
      if (actionText) {
        todos.push({
          title: actionText,
          priority: 'MEDIUM',
        });
      }
    }
  }

  return todos;
}

// GET /api/todos - List all todos (filter by completed status)
// POST /api/todos - Create todo
// POST /api/todos/from-ai - Generate todos from AI Morning Report

export async function GET(req: Request): Promise<Response> {
  const auth = await authenticateRequest(req);
  if (!auth) {
    return unauthorizedResponse();
  }

  try {
    const url = new URL(req.url);
    const completed = url.searchParams.get('completed');
    const where =
      completed !== undefined
        ? { completed: completed === 'true', userId: auth.userId }
        : { userId: auth.userId };

    const todos = await prisma.todo.findMany({
      where,
      include: {
        ticket: {
          select: {
            id: true,
            title: true,
            status: true,
            priority: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return jsonResponse(todos);
  } catch (error: any) {
    console.error('[GET /api/todos] Error:', error);
    return errorResponse(error instanceof Error ? error.message : 'Unknown error', 500);
  }
}

export async function POST(req: Request): Promise<Response> {
  const auth = await authenticateRequest(req);
  if (!auth) {
    return unauthorizedResponse();
  }

  try {
    const body = await req.json();

    // Check if this is a from-ai request
    if (body.report !== undefined) {
      const { report }: { report: string } = body;

      if (!report || typeof report !== 'string') {
        return errorResponse('Report is required', 400);
      }

      const parsedTodos = parseAIReportToTodos(report);

      if (parsedTodos.length === 0) {
        return jsonResponse({ count: 0, message: 'No actionable items found' });
      }

      const todos = await Promise.all(
        parsedTodos.map(async (todo) => {
          if (todo.ticketId) {
            const isValidUUID =
              /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
                todo.ticketId
              );

            if (!isValidUUID) {
              const titleWithoutPriority = todo.title
                .replace(/^\[(CRITICAL|HIGH|MEDIUM|LOW|RISK)\]\s*/i, '')
                .replace(/\s*\(ID:[^)]+\)\s*$/i, '')
                .trim();
              const ticket = await prisma.ticket.findFirst({
                where: { userId: auth.userId, title: { contains: titleWithoutPriority } },
                select: { id: true },
              });
              return { ...todo, ticketId: ticket?.id || null };
            }
          }
          return todo;
        })
      );

      const created = await prisma.todo.createMany({
        data: todos.map((t) => ({
          title: t.title,
          description: t.description,
          priority: t.priority,
          ticketId: t.ticketId,
          userId: auth.userId,
          source: 'ai_morning_report' as const,
        })),
      });

      return jsonResponse({ count: created.count, todos });
    }

    // Regular todo creation
    const data = createTodoSchema.parse(body);

    if (data.ticketId) {
      const ticket = await prisma.ticket.findFirst({
        where: { id: data.ticketId, userId: auth.userId },
      });
      if (!ticket) {
        return errorResponse('Ticket not found', 404);
      }
    }

    const todo = await prisma.todo.create({
      data: { ...data, userId: auth.userId, source: data.source || 'manual' },
      include: { ticket: true },
    });

    return jsonResponse(todo, 201);
  } catch (error: any) {
    console.error('[POST /api/todos] Error:', error);
    if (error.name === 'ZodError') {
      return errorResponse('Validation error: ' + JSON.stringify(error.errors), 400);
    }
    return errorResponse(error instanceof Error ? error.message : 'Unknown error', 500);
  }
}

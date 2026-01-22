import { Router, Response } from 'express';
import { prisma } from '../utils/db.js';
import { authenticateToken, AuthRequest } from '../middleware/auth.js';
import { createTodoSchema, updateTodoSchema, toggleTodoSchema } from '../utils/validation.js';

const router = Router();

// GET /api/todos - List all todos (filter by completed status)
router.get('/', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  const { completed } = req.query;
  const where = completed !== undefined ? { completed: completed === 'true', userId: req.userId! } : { userId: req.userId! };
  const todos = await prisma.todo.findMany({
    where,
    include: { ticket: { select: { id: true, title: true, status: true, priority: true } } },
    orderBy: { createdAt: 'desc' }
  });
  res.json(todos);
});

// GET /api/todos/active - Get active (not completed) todos
router.get('/active', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  const todos = await prisma.todo.findMany({
    where: { completed: false, userId: req.userId! },
    include: { ticket: { select: { id: true, title: true, status: true, priority: true, tags: true } } },
    orderBy: [{ priority: 'desc' }, { createdAt: 'asc' }]
  });
  res.json(todos);
});

// POST /api/todos - Create todo
router.post('/', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  const data = createTodoSchema.parse(req.body);
  const userId = req.userId!;

  // If ticketId is provided, verify ticket exists and belongs to user
  if (data.ticketId) {
    const ticket = await prisma.ticket.findFirst({
      where: { id: data.ticketId, userId },
    });
    if (!ticket) {
      res.status(404).json({ error: 'Ticket not found' });
      return;
    }
  }

  const todo = await prisma.todo.create({
    data: { ...data, userId, source: data.source || 'manual' },
    include: { ticket: true }
  });
  res.json(todo);
});

// PATCH /api/todos/:id/toggle - Toggle completion
router.patch('/:id/toggle', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.userId!;
  const { completed } = toggleTodoSchema.parse(req.body);

  const existing = await prisma.todo.findFirst({
    where: { id: req.params.id, userId },
  });
  if (!existing) {
    res.status(404).json({ error: 'Todo not found' });
    return;
  }

  const todo = await prisma.todo.update({
    where: { id: req.params.id },
    data: {
      completed,
      completedAt: completed ? new Date() : null
    },
    include: { ticket: { select: { id: true, title: true, status: true, priority: true, tags: true } } }
  });
  res.json(todo);
});

// PUT /api/todos/:id - Update todo
router.put('/:id', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.userId!;
  const data = updateTodoSchema.parse(req.body);

  const existing = await prisma.todo.findFirst({
    where: { id: req.params.id, userId },
  });
  if (!existing) {
    res.status(404).json({ error: 'Todo not found' });
    return;
  }

  const todo = await prisma.todo.update({
    where: { id: req.params.id },
    data,
    include: { ticket: { select: { id: true, title: true, status: true, priority: true, tags: true } } }
  });
  res.json(todo);
});

// DELETE /api/todos/:id - Delete todo
router.delete('/:id', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.userId!;

  const existing = await prisma.todo.findFirst({
    where: { id: req.params.id, userId },
  });
  if (!existing) {
    res.status(404).json({ error: 'Todo not found' });
    return;
  }

  try {
    await prisma.todo.delete({ where: { id: req.params.id } });
  } catch (error) {
    // If record not found, that's ok - it was already deleted
    if ((error as any).code === 'P2025') {
      res.status(204).send();
      return;
    }
    throw error;
  }
  res.status(204).send();
});

// POST /api/todos/from-ai - Generate todos from AI Morning Report
interface FromAIRequest {
  report: string;
}

router.post('/from-ai', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.userId!;
  const { report }: FromAIRequest = req.body;

  if (!report || typeof report !== 'string') {
    res.status(400).json({ error: 'Report is required' });
    return;
  }

  // Parse AI report to extract actionable items
  const parsedTodos = parseAIReportToTodos(report);

  if (parsedTodos.length === 0) {
    res.json({ count: 0, message: 'No actionable items found' });
    return;
  }

  // Resolve ticket IDs by title if needed (AI may generate truncated IDs)
  const todos = await Promise.all(parsedTodos.map(async (todo) => {
    if (todo.ticketId) {
      // Check if it's a valid UUID format (with dashes)
      const isValidUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(todo.ticketId);

      if (!isValidUUID) {
        // Try to find ticket by title instead, ensuring it belongs to user
        const titleWithoutPriority = todo.title.replace(/^\[(CRITICAL|HIGH|MEDIUM|LOW|RISK)\]\s*/i, '').replace(/\s*\(ID:[^)]+\)\s*$/i, '').trim();
        const ticket = await prisma.ticket.findFirst({
          where: { userId, title: { contains: titleWithoutPriority } },
          select: { id: true }
        });
        return { ...todo, ticketId: ticket?.id || null };
      }
    }
    return todo;
  }));

  // Create todos in batch
  const created = await prisma.todo.createMany({
    data: todos.map(t => ({
      title: t.title,
      description: t.description,
      priority: t.priority,
      ticketId: t.ticketId,
      userId,
      source: 'ai_morning_report' as const,
    })),
  });

  res.json({ count: created.count, todos });
});

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

  // Split report into lines
  const lines = report.split('\n').map(l => l.trim()).filter(l => l);

  // Look for patterns that indicate action items
  // Common patterns in morning report:
  // 1. "**[PRIORITY] Title (ID: xxx)**" lines in FOCUS TODAY section
  // 2. "- **Title (ID: xxx)**" lines in RISK ALERT section
  // 3. "- Suggested action" lines in RECOMMENDATIONS section
  // 4. "**Action:**" lines
  // 5. Lines with "Action:" or "Need to:"

  let currentSection = '';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Track current section
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

    // Parse FOCUS TODAY items
    if (currentSection === 'focus' && line.match(/^\d+\.\s+/)) {
      // Format: "1. **[CRITICAL] Login failure (ID: xxx)**"
      const priorityMatch = line.match(/\[(CRITICAL|HIGH|MEDIUM|LOW)\]/i);
      const priority = (priorityMatch?.[1]?.toUpperCase() || 'MEDIUM') as 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

      // Extract title and ID
      const titleMatch = line.match(/\*\*([^*]+)\*\*/);
      const idMatch = line.match(/\(ID:\s*([a-f0-9-]+)\)/i);

      if (titleMatch) {
        const title = titleMatch[1].replace(/\[(CRITICAL|HIGH|MEDIUM|LOW)\]\s*/i, '').trim();
        const ticketId = idMatch?.[1];

        // Look for "Action:" on next lines
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

    // Parse RISK ALERT items
    if (currentSection === 'risk' && line.startsWith('- **')) {
      const priorityMatch = line.match(/\[(CRITICAL|HIGH|MEDIUM|LOW)\]/i);
      const priority = (priorityMatch?.[1]?.toUpperCase() || 'HIGH') as 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

      const titleMatch = line.match(/-?\s*\*\*([^*]+)\*\*/);
      const idMatch = line.match(/\(ID:\s*([a-f0-9-]+)\)/i);

      if (titleMatch) {
        const title = titleMatch[1].replace(/\[(CRITICAL|HIGH|MEDIUM|LOW)\]\s*/i, '').trim();
        const ticketId = idMatch?.[1];

        // Extract risk info from after the title
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

    // Parse RECOMMENDATIONS items
    if (currentSection === 'recommendations' && line.startsWith('-')) {
      const recommendation = line.replace(/^-\s*/, '').trim();

      if (recommendation && !recommendation.startsWith('**')) {
        todos.push({
          title: recommendation,
          priority: 'MEDIUM',
        });
      }
    }

    // Parse generic action items
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

export { router as todoRoutes };

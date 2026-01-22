import { prisma } from '../../src/lib/db';
import { hashPassword, generateToken, jsonResponse, errorResponse } from '../../src/lib/auth';
import { registerSchema } from '../../src/lib/validation';

export async function POST(req: Request): Promise<Response> {
  try {
    const body = await req.json();
    const data = registerSchema.parse(body);

    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) {
      return errorResponse('Email already registered', 400);
    }

    const passwordHash = await hashPassword(data.password);

    const user = await prisma.user.create({
      data: {
        email: data.email,
        passwordHash,
        name: data.name,
      },
    });

    // Create default settings for the new user
    await prisma.settings.create({
      data: {
        userId: user.id,
        deepseekModel: 'deepseek-chat',
        deepseekTemperature: 0.7,
        reminderStagnantDays: 5,
        reminderWaitingClientDays: 3,
        reminderHighPriorityDays: 2,
        reminderOldTicketDays: 14,
        aiAnalysisInterval: 4,
        theme: 'dark',
      },
    });

    const token = generateToken({ userId: user.id, email: user.email });

    return jsonResponse(
      {
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
      },
      201
    );
  } catch (error: any) {
    console.error('[REGISTER] Error:', error);

    if (error.name === 'ZodError') {
      return errorResponse('Validation error: ' + JSON.stringify(error.errors), 400);
    }

    return errorResponse(
      error instanceof Error ? error.message : 'Unknown error',
      500
    );
  }
}

import { prisma } from '../../src/lib/db';
import { verifyPassword, generateToken, jsonResponse, errorResponse } from '../../src/lib/auth';
import { loginSchema } from '../../src/lib/validation';

export async function POST(req: Request): Promise<Response> {
  try {
    const body = await req.json();
    const data = loginSchema.parse(body);

    const user = await prisma.user.findUnique({ where: { email: data.email } });
    if (!user) {
      return errorResponse('Invalid email or password', 401);
    }

    const isValid = await verifyPassword(data.password, user.passwordHash);
    if (!isValid) {
      return errorResponse('Invalid email or password', 401);
    }

    const token = generateToken({ userId: user.id, email: user.email });

    return jsonResponse({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    });
  } catch (error: any) {
    console.error('[LOGIN] Error:', error);

    if (error.name === 'ZodError') {
      return errorResponse('Validation error: ' + JSON.stringify(error.errors), 400);
    }

    return errorResponse(
      error instanceof Error ? error.message : 'Unknown error',
      500
    );
  }
}

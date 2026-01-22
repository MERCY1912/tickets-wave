import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { prisma } from './db';

const JWT_SECRET = process.env.JWT_SECRET || 'change-this-in-production-min-32-chars';
const SALT_ROUNDS = 10;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function generateToken(payload: { userId: string; email: string }): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string): { userId: string; email: string } | null {
  try {
    return jwt.verify(token, JWT_SECRET) as { userId: string; email: string };
  } catch {
    return null;
  }
}

export interface AuthenticatedRequest extends Request {
  userId?: string;
  userEmail?: string;
}

// Middleware for Vercel serverless functions
export async function authenticateRequest(req: Request): Promise<{ userId: string; email: string } | null> {
  const authHeader = req.headers.get('authorization');

  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.split(' ')[1];
  const payload = verifyToken(token);

  if (!payload) {
    return null;
  }

  // Verify user exists
  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: { id: true, email: true },
  });

  if (!user) {
    return null;
  }

  return { userId: user.id, email: user.email };
}

// Helper to return unauthorized response
export function unauthorizedResponse() {
  return new Response(JSON.stringify({ error: 'Unauthorized' }), {
    status: 401,
    headers: { 'Content-Type': 'application/json' },
  });
}

// Helper to return error response
export function errorResponse(message: string, status: number = 500) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

// Helper to return JSON response
export function jsonResponse(data: unknown, status: number = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

// Helper to parse JSON from request
export async function parseJsonBody<T>(req: Request): Promise<T> {
  return req.json() as Promise<T>;
}

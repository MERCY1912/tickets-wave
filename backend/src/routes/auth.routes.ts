import { Router } from 'express';
import { prisma } from '../utils/db.js';
import { hashPassword, verifyPassword, generateToken } from '../utils/auth.js';
import { registerSchema, loginSchema } from '../utils/validation.js';

export const authRoutes = Router();

// POST /api/auth/register
authRoutes.post('/register', async (req, res): Promise<void> => {
  try {
    console.log('[REGISTER] Request body:', { email: req.body.email, name: req.body.name });

    const data = registerSchema.parse(req.body);

    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) {
      console.log('[REGISTER] Email already registered:', data.email);
      res.status(400).json({ error: 'Email already registered' });
      return;
    }

    console.log('[REGISTER] Hashing password...');
    const passwordHash = await hashPassword(data.password);

    console.log('[REGISTER] Creating user...');
    const user = await prisma.user.create({
      data: {
        email: data.email,
        passwordHash,
        name: data.name,
      },
    });
    console.log('[REGISTER] User created:', user.id);

    console.log('[REGISTER] Creating settings...');
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
    console.log('[REGISTER] Settings created');

    console.log('[REGISTER] Generating token...');
    const token = generateToken({ userId: user.id, email: user.email });

    res.status(201).json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    });
    console.log('[REGISTER] Success');
  } catch (error) {
    console.error('[REGISTER] Error:', error);

    if (error instanceof Error && 'issues' in error) {
      res.status(400).json({ error: 'Validation error', details: error });
      return;
    }
    res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// POST /api/auth/login
authRoutes.post('/login', async (req, res): Promise<void> => {
  try {
    console.log('[LOGIN] Request body:', { email: req.body.email });

    const data = loginSchema.parse(req.body);

    const user = await prisma.user.findUnique({ where: { email: data.email } });
    if (!user) {
      console.log('[LOGIN] User not found:', data.email);
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    const isValid = await verifyPassword(data.password, user.passwordHash);
    if (!isValid) {
      console.log('[LOGIN] Invalid password');
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    const token = generateToken({ userId: user.id, email: user.email });

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    });
    console.log('[LOGIN] Success');
  } catch (error) {
    console.error('[LOGIN] Error:', error);

    if (error instanceof Error && 'issues' in error) {
      res.status(400).json({ error: 'Validation error', details: error });
      return;
    }
    res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

import { Router } from 'express';
import { prisma } from '../utils/db.js';
import { hashPassword, verifyPassword, generateToken } from '../utils/auth.js';
import { registerSchema, loginSchema } from '../utils/validation.js';

export const authRoutes = Router();

// POST /api/auth/register
authRoutes.post('/register', async (req, res): Promise<void> => {
  try {
    const data = registerSchema.parse(req.body);

    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) {
      res.status(400).json({ error: 'Email already registered' });
      return;
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

    res.status(201).json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    });
  } catch (error) {
    if (error instanceof Error && 'issues' in error) {
      res.status(400).json({ error: 'Validation error', details: error });
      return;
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/auth/login
authRoutes.post('/login', async (req, res): Promise<void> => {
  try {
    const data = loginSchema.parse(req.body);

    const user = await prisma.user.findUnique({ where: { email: data.email } });
    if (!user) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    const isValid = await verifyPassword(data.password, user.passwordHash);
    if (!isValid) {
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
  } catch (error) {
    if (error instanceof Error && 'issues' in error) {
      res.status(400).json({ error: 'Validation error', details: error });
      return;
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

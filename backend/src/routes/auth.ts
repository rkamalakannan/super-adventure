import { Router } from 'express';
import bcrypt from 'bcrypt';
import { z } from 'zod';
import { db } from '../db';
import { users } from '../db/schema';
import { generateToken, type AuthRequest } from '../middleware/auth';

const router = Router();

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

router.post('/register', async (req, res) => {
  try {
    const body = registerSchema.parse(req.body);
    
    const existingUser = await db.query.users.findFirst({
      where: (users, { eq }) => eq(users.email, body.email),
    });
    
    if (existingUser) {
      res.status(400).json({ error: 'Email already registered' });
      return;
    }
    
    const passwordHash = await bcrypt.hash(body.password, 10);
    
    const [newUser] = await db.insert(users).values({
      email: body.email,
      passwordHash,
    }).returning();
    
    const token = generateToken(newUser.id);
    
    res.status(201).json({
      user: {
        id: newUser.id,
        email: newUser.email,
        createdAt: newUser.createdAt,
      },
      token,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.errors[0].message });
      return;
    }
    console.error('[AUTH] Register error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const body = loginSchema.parse(req.body);
    
    const user = await db.query.users.findFirst({
      where: (users, { eq }) => eq(users.email, body.email),
    });
    
    if (!user) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }
    
    const passwordValid = await bcrypt.compare(body.password, user.passwordHash);
    
    if (!passwordValid) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }
    
    const token = generateToken(user.id);
    
    res.json({
      user: {
        id: user.id,
        email: user.email,
        createdAt: user.createdAt,
      },
      token,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.errors[0].message });
      return;
    }
    console.error('[AUTH] Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
import jwt from 'jsonwebtoken';
import type { Request, Response, NextFunction } from 'express';
import { getAppConfig } from '../config/env';
import { db } from '../db';
import { users } from '../db/schema';

export interface AuthRequest extends Request {
  userId?: number;
}

export function generateToken(userId: number): string {
  const config = getAppConfig();
  return jwt.sign({ userId }, config.jwtSecret, { expiresIn: '7d' });
}

export function verifyToken(token: string): number | null {
  try {
    const config = getAppConfig();
    const decoded = jwt.verify(token, config.jwtSecret) as { userId: number };
    return decoded.userId;
  } catch {
    return null;
  }
}

export async function authMiddleware(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'No token provided' });
    return;
  }
  
  const token = authHeader.substring(7);
  const userId = verifyToken(token);
  
  if (!userId) {
    res.status(401).json({ error: 'Invalid or expired token' });
    return;
  }
  
  const user = await db.query.users.findFirst({
    where: (users, { eq }) => eq(users.id, userId),
  });
  
  if (!user) {
    res.status(401).json({ error: 'User not found' });
    return;
  }
  
  req.userId = userId;
  next();
}
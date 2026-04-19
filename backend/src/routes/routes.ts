import { Router } from 'express';
import { z } from 'zod';
import { db } from '../db';
import { routes } from '../db/schema';
import { authMiddleware, type AuthRequest } from '../middleware/auth';

const router = Router();

router.use(authMiddleware);

const createRouteSchema = z.object({
  fromCity: z.string().min(1),
  toCity: z.string().min(1),
  travelDate: z.string(), 
  thresholdPrice: z.number().positive(),
  alertEnabled: z.boolean().optional(),
});

const updateRouteSchema = z.object({
  fromCity: z.string().min(1).optional(),
  toCity: z.string().min(1).optional(),
  travelDate: z.string().optional(),
  thresholdPrice: z.number().positive().optional(),
  alertEnabled: z.boolean().optional(),
});

router.get('/', async (req: AuthRequest, res) => {
  try {
    const userRoutes = await db.query.routes.findMany({
      where: (routes, { eq }) => eq(routes.userId, req.userId!),
    });
    
    res.json(userRoutes);
  } catch (error) {
    console.error('[ROUTES] Get all error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/:id', async (req: AuthRequest, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    
    if (isNaN(id)) {
      res.status(400).json({ error: 'Invalid route ID' });
      return;
    }
    
    const route = await db.query.routes.findFirst({
      where: (routes, { eq, and }) => and(eq(routes.id, id), eq(routes.userId, req.userId!)),
    });
    
    if (!route) {
      res.status(404).json({ error: 'Route not found' });
      return;
    }
    
    res.json(route);
  } catch (error) {
    console.error('[ROUTES] Get one error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/', async (req: AuthRequest, res) => {
  try {
    const body = createRouteSchema.parse(req.body);
    
    const [newRoute] = await db.insert(routes).values({
      userId: req.userId!,
      fromCity: body.fromCity,
      toCity: body.toCity,
      travelDate: body.travelDate,
      thresholdPrice: body.thresholdPrice,
      alertEnabled: body.alertEnabled ?? true,
    }).returning();
    
    res.status(201).json(newRoute);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.errors[0].message });
      return;
    }
    console.error('[ROUTES] Create error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/:id', async (req: AuthRequest, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    
    if (isNaN(id)) {
      res.status(400).json({ error: 'Invalid route ID' });
      return;
    }
    
    const body = updateRouteSchema.parse(req.body);
    
    const existingRoute = await db.query.routes.findFirst({
      where: (routes, { eq, and }) => and(eq(routes.id, id), eq(routes.userId, req.userId!)),
    });
    
    if (!existingRoute) {
      res.status(404).json({ error: 'Route not found' });
      return;
    }
    
    const [updatedRoute] = await db
      .update(routes)
      .set({
        ...(body.fromCity && { fromCity: body.fromCity }),
        ...(body.toCity && { toCity: body.toCity }),
        ...(body.travelDate && { travelDate: body.travelDate }),
        ...(body.thresholdPrice && { thresholdPrice: body.thresholdPrice }),
        ...(body.alertEnabled !== undefined && { alertEnabled: body.alertEnabled }),
      })
      .where((routes, { eq }) => eq(routes.id, id))
      .returning();
    
    res.json(updatedRoute);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.errors[0].message });
      return;
    }
    console.error('[ROUTES] Update error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/:id', async (req: AuthRequest, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    
    if (isNaN(id)) {
      res.status(400).json({ error: 'Invalid route ID' });
      return;
    }
    
    const existingRoute = await db.query.routes.findFirst({
      where: (routes, { eq, and }) => and(eq(routes.id, id), eq(routes.userId, req.userId!)),
    });
    
    if (!existingRoute) {
      res.status(404).json({ error: 'Route not found' });
      return;
    }
    
    await db.delete(routes).where((routes, { eq }) => eq(routes.id, id));
    
    res.status(204).send();
  } catch (error) {
    console.error('[ROUTES] Delete error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
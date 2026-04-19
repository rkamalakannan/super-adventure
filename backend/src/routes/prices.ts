import { Router } from 'express';
import { db } from '../db';
import { routes, priceHistory } from '../db/schema';
import { authMiddleware, type AuthRequest } from '../middleware/auth';
import { fetchPrice } from '../providers/mockPriceProvider';

const router = Router();

router.use(authMiddleware);

router.get('/:id/prices', async (req: AuthRequest, res) => {
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
    
    const prices = await db.query.priceHistory.findMany({
      where: (priceHistory, { eq }) => eq(priceHistory.routeId, id),
      orderBy: (priceHistory, { desc }) => [desc(priceHistory.fetchedAt)],
      limit: 50,
    });
    
    res.json({
      route,
      prices,
    });
  } catch (error) {
    console.error('[PRICES] Get prices error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/:id/fetch', async (req: AuthRequest, res) => {
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
    
    const price = await fetchPrice(route.fromCity, route.toCity, route.travelDate);
    
    const [priceRecord] = await db.insert(priceHistory).values({
      routeId: id,
      price,
    }).returning();
    
    res.json({
      route,
      price: priceRecord,
    });
  } catch (error) {
    console.error('[PRICES] Fetch price error:', error);
    res.status(500).json({ error: 'Failed to fetch price' });
  }
});

export default router;
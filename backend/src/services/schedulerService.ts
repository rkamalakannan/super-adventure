import cron from 'node-cron';
import { db } from '../db';
import { routes, priceHistory, users } from '../db/schema';
import { fetchPrice } from '../providers/mockPriceProvider';
import { sendPriceAlert } from '../services/emailService';

let priceCheckJob: cron.ScheduledTask | null = null;

async function fetchAndStorePrice(routeId: number, userId: number): Promise<{ price: number; shouldAlert: boolean } | null> {
  try {
    const route = await db.query.routes.findFirst({
      where: (routes, { eq }) => eq(routes.id, routeId),
    });
    
    if (!route || !route.alertEnabled) {
      return null;
    }
    
    const price = await fetchPrice(route.fromCity, route.toCity, route.travelDate);
    
    const [priceRecord] = await db.insert(priceHistory).values({
      routeId: route.id,
      price,
    }).returning();
    
    console.log(`[SCHEDULER] Fetched price for route ${route.id}: €${price.toFixed(2)}`);
    
    const shouldAlert = price <= route.thresholdPrice;
    
    return { price, shouldAlert };
  } catch (error) {
    console.error(`[SCHEDULER] Error fetching price for route ${routeId}:`, error);
    return null;
  }
}

async function sendAlerts() {
  try {
    const allRoutes = await db.query.routes.findMany({
      where: (routes, { eq }) => eq(routes.alertEnabled, true),
    });
    
    console.log(`[SCHEDULER] Checking ${allRoutes.length} routes for price alerts...`);
    
    for (const route of allRoutes) {
      try {
        const latestPrice = await db.query.priceHistory.findFirst({
          where: (priceHistory, { eq }) => eq(priceHistory.routeId, route.id),
          orderBy: (priceHistory, { desc }) => [desc(priceHistory.fetchedAt)],
        });
        
        if (!latestPrice) {
          continue;
        }
        
        if (latestPrice.price <= route.thresholdPrice) {
          const user = await db.query.users.findFirst({
            where: (users, { eq }) => eq(users.id, route.userId),
          });
          
          if (user) {
            await sendPriceAlert(
              user.email,
              {
                fromCity: route.fromCity,
                toCity: route.toCity,
                travelDate: route.travelDate,
              },
              latestPrice.price,
              route.thresholdPrice
            );
            
            console.log(`[SCHEDULER] Price alert sent for route ${route.id}`);
          }
        }
      } catch (error) {
        console.error(`[SCHEDULER] Error processing alert for route ${route.id}:`, error);
      }
    }
  } catch (error) {
    console.error('[SCHEDULER] Error sending alerts:', error);
  }
}

async function priceCheckTask() {
  console.log('[SCHEDULER] Running scheduled price check...');
  
  try {
    const allRoutes = await db.query.routes.findMany();
    console.log(`[SCHEDULER] Found ${allRoutes.length} routes to check`);
    
    for (const route of allRoutes) {
      await fetchAndStorePrice(route.id, route.userId);
    }
    
    await sendAlerts();
    
    console.log('[SCHEDULER] Price check completed');
  } catch (error) {
    console.error('[SCHEDULER] Price check failed:', error);
  }
}

export function startScheduler(): void {
  if (priceCheckJob) {
    console.log('[SCHEDULER] Scheduler already running');
    return;
  }
  
  priceCheckJob = cron.schedule('0 * * * *', priceCheckTask);
  
  console.log('[SCHEDULER] Scheduler started - checking prices every hour');
}

export function stopScheduler(): void {
  if (priceCheckJob) {
    priceCheckJob.stop();
    priceCheckJob = null;
    console.log('[SCHEDULER] Scheduler stopped');
  }
}

export async function runImmediatePriceCheck(): Promise<void> {
  await priceCheckTask();
}
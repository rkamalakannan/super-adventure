import { PriceProvider } from './priceProvider';

const ROUTE_BASE_PRICES: Record<string, number> = {
  'Vienna-Salzburg': 29,
  'Salzburg-Vienna': 29,
  'Vienna-Innsbruck': 49,
  'Innsbruck-Vienna': 49,
  'Vienna-Graz': 19,
  'Graz-Vienna': 19,
  'Vienna-Linz': 14,
  'Linz-Vienna': 14,
  'Vienna-Klagenfurt': 24,
  'Klagenfurt-Vienna': 24,
  'Vienna-Bregenz': 39,
  'Bregenz-Vienna': 39,
  'Salzburg-Innsbruck': 29,
  'Innsbruck-Salzburg': 29,
  'Salzburg-Graz': 29,
  'Graz-Salzburg': 29,
  'Linz-Salzburg': 19,
  'Salzburg-Linz': 19,
  'Linz-Innsbruck': 34,
  'Innsbruck-Linz': 34,
  'Graz-Innsbruck': 39,
  'Innsbruck-Graz': 39,
  'Vienna-Munich': 59,
  'Munich-Vienna': 59,
  'Vienna-Berlin': 89,
  'Berlin-Vienna': 89,
  'Vienna-Hamburg': 99,
  'Hamburg-Vienna': 99,
  'Salzburg-Munich': 29,
  'Munich-Salzburg': 29,
  'Innsbruck-Munich': 24,
  'Munich-Innsbruck': 24,
};

const TIME_MULTIPLIERS: Record<number, number> = {
  6: 1.3,
  7: 1.4,
  8: 1.5,
  9: 1.4,
  10: 1.2,
  11: 1.1,
  12: 1.0,
  13: 1.0,
  14: 1.1,
  15: 1.2,
  16: 1.3,
  17: 1.5,
  18: 1.6,
  19: 1.4,
  20: 1.2,
  21: 1.1,
  22: 1.0,
};

function getDayOfWeek(dateStr: string): number {
  const date = new Date(dateStr);
  return date.getDay();
}

function getDayMultiplier(dateStr: string): number {
  const day = getDayOfWeek(dateStr);
  if (day === 5 || day === 6) return 1.3;
  if (day === 0) return 1.2;
  return 1.0;
}

export class MockPriceProvider implements PriceProvider {
  async fetchPrice(from: string, to: string, date: string): Promise<number> {
    const routeKey = `${from}-${to}`;
    const reverseKey = `${to}-${from}`;
    const basePrice = ROUTE_BASE_PRICES[routeKey] || ROUTE_BASE_PRICES[reverseKey] || 35;

    const dateObj = new Date(date);
    const hour = dateObj.getHours();

    const timeMultiplier = TIME_MULTIPLIERS[hour] || 1.0;
    const dayMultiplier = getDayMultiplier(date);

    const seasonalMultiplier = this.getSeasonalMultiplier(dateObj);

    const randomVariance = 0.8 + Math.random() * 0.4;

    const finalPrice = basePrice * timeMultiplier * dayMultiplier * seasonalMultiplier * randomVariance;

    console.log(`[MockPriceProvider] Fetched price for ${from} -> ${to} on ${date}: €${finalPrice.toFixed(2)}`);

    return Math.round(finalPrice * 100) / 100;
  }

  private getSeasonalMultiplier(date: Date): number {
    const month = date.getMonth();
    if (month === 6 || month === 7 || month === 11 || month === 0) {
      return 1.25;
    }
    if (month === 8 || month === 9) {
      return 1.1;
    }
    return 1.0;
  }
}

export const mockPriceProvider = new MockPriceProvider();
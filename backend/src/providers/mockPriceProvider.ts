export interface PriceRoute {
  fromCity: string;
  toCity: string;
  basePrice: number;
  priceRange: { min: number; max: number };
}

const AUSTRIAN_ROUTES: PriceRoute[] = [
  { fromCity: 'Vienna', toCity: 'Salzburg', basePrice: 60, priceRange: { min: 40, max: 80 } },
  { fromCity: 'Vienna', toCity: 'Innsbruck', basePrice: 90, priceRange: { min: 60, max: 120 } },
  { fromCity: 'Vienna', toCity: 'Graz', basePrice: 45, priceRange: { min: 25, max: 65 } },
  { fromCity: 'Vienna', toCity: 'Linz', basePrice: 35, priceRange: { min: 20, max: 50 } },
  { fromCity: 'Vienna', toCity: 'Klagenfurt', basePrice: 70, priceRange: { min: 45, max: 95 } },
  { fromCity: 'Vienna', toCity: 'Bregenz', basePrice: 80, priceRange: { min: 50, max: 110 } },
  { fromCity: 'Vienna', toCity: 'St. Pölten', basePrice: 20, priceRange: { min: 12, max: 30 } },
  { fromCity: 'Vienna', toCity: 'Wels', basePrice: 40, priceRange: { min: 25, max: 55 } },
  { fromCity: 'Salzburg', toCity: 'Innsbruck', basePrice: 50, priceRange: { min: 35, max: 70 } },
  { fromCity: 'Salzburg', toCity: 'Graz', basePrice: 55, priceRange: { min: 35, max: 75 } },
  { fromCity: 'Salzburg', toCity: 'Vienna', basePrice: 60, priceRange: { min: 40, max: 80 } },
  { fromCity: 'Innsbruck', toCity: 'Vienna', basePrice: 90, priceRange: { min: 60, max: 120 } },
  { fromCity: 'Innsbruck', toCity: 'Salzburg', basePrice: 50, priceRange: { min: 35, max: 70 } },
  { fromCity: 'Graz', toCity: 'Vienna', basePrice: 45, priceRange: { min: 25, max: 65 } },
  { fromCity: 'Graz', toCity: 'Salzburg', basePrice: 55, priceRange: { min: 35, max: 75 } },
  { fromCity: 'Linz', toCity: 'Vienna', basePrice: 35, priceRange: { min: 20, max: 50 } },
  { fromCity: 'Klagenfurt', toCity: 'Vienna', basePrice: 70, priceRange: { min: 45, max: 95 } },
  { fromCity: 'Bregenz', toCity: 'Vienna', basePrice: 80, priceRange: { min: 50, max: 110 } },
];

const CITIES = [
  'Vienna', 'Salzburg', 'Innsbruck', 'Graz', 'Linz',
  'Klagenfurt', 'Bregenz', 'St. Pölten', 'Wels', 'Villach'
];

function findRoute(fromCity: string, toCity: string): PriceRoute | undefined {
  return AUSTRIAN_ROUTES.find(
    r => r.fromCity === fromCity && r.toCity === toCity
  );
}

function generateRandomPrice(route: PriceRoute, travelDate: Date): number {
  const { min, max } = route.priceRange;
  
  const dayOfWeek = travelDate.getDay();
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 5 || dayOfWeek === 6;
  const isFriday = dayOfWeek === 5;
  
  let priceVariation = Math.random();
  
  if (isWeekend) {
    priceVariation += 0.15;
  } else if (isFriday) {
    priceVariation += 0.1;
  }
  
  const daysAhead = Math.floor((travelDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  if (daysAhead < 7) {
    priceVariation -= 0.1;
  } else if (daysAhead > 30) {
    priceVariation += 0.1;
  }
  
  priceVariation = Math.max(0, Math.min(1, priceVariation));
  
  return Math.round((min + (max - min) * priceVariation) * 100) / 100;
}

export interface PriceInfo {
  fromCity: string;
  toCity: string;
  date: string;
  price: number;
}

export async function fetchPrice(
  fromCity: string,
  toCity: string,
  date: string
): Promise<number> {
  const normalizedFrom = fromCity.trim();
  const normalizedTo = toCity.trim();
  const travelDate = new Date(date);
  
  if (isNaN(travelDate.getTime())) {
    throw new Error('Invalid date format. Use YYYY-MM-DD');
  }
  
  const route = findRoute(normalizedFrom, normalizedTo);
  
  if (route) {
    const simulatedDelay = Math.random() * 500 + 100;
    await new Promise(resolve => setTimeout(resolve, simulatedDelay));
    return generateRandomPrice(route, travelDate);
  }
  
  const reversedRoute = findRoute(normalizedTo, normalizedFrom);
  if (reversedRoute) {
    const simulatedDelay = Math.random() * 500 + 100;
    await new Promise(resolve => setTimeout(resolve, simulatedDelay));
    return generateRandomPrice(reversedRoute, travelDate);
  }
  
  const basePrice = 50 + Math.random() * 50;
  const simulatedDelay = Math.random() * 500 + 100;
  await new Promise(resolve => setTimeout(resolve, simulatedDelay));
  return Math.round((basePrice + Math.random() * 30) * 100) / 100;
}

export function getAvailableCities(): string[] {
  return [...CITIES];
}
export interface PriceProvider {
  fetchPrice(from: string, to: string, date: string): Promise<number>;
}
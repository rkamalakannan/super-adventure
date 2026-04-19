import { pgTable, serial, varchar, timestamp, integer, real, boolean, index } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  emailIdx: index('idx_users_email').on(table.email),
}));

export const routes = pgTable('routes', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  fromCity: varchar('from_city', { length: 100 }).notNull(),
  toCity: varchar('to_city', { length: 100 }).notNull(),
  travelDate: varchar('travel_date', { length: 10 }).notNull(),
  thresholdPrice: real('threshold_price').notNull(),
  alertEnabled: boolean('alert_enabled').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index('idx_routes_user_id').on(table.userId),
  travelDateIdx: index('idx_routes_travel_date').on(table.travelDate),
}));

export const priceHistory = pgTable('price_history', {
  id: serial('id').primaryKey(),
  routeId: integer('route_id').notNull().references(() => routes.id, { onDelete: 'cascade' }),
  price: real('price').notNull(),
  fetchedAt: timestamp('fetched_at').defaultNow().notNull(),
}, (table) => ({
  routeIdIdx: index('idx_price_history_route_id').on(table.routeId),
  fetchedAtIdx: index('idx_price_history_fetched_at').on(table.fetchedAt),
}));

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Route = typeof routes.$inferSelect;
export type NewRoute = typeof routes.$inferInsert;
export type PriceHistory = typeof priceHistory.$inferSelect;
export type NewPriceHistory = typeof priceHistory.$inferInsert;
import { pgTable, serial, varchar, timestamp, decimal, boolean, integer, index } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  email: varchar('email', { length: 255 }).unique().notNull(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const routes = pgTable('routes', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  fromCity: varchar('from_city', { length: 100 }).notNull(),
  toCity: varchar('to_city', { length: 100 }).notNull(),
  travelDate: timestamp('travel_date').notNull(),
  thresholdPrice: decimal('threshold_price', { precision: 10, scale: 2 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index('idx_routes_user_id').on(table.userId),
}));

export const priceHistory = pgTable('price_history', {
  id: serial('id').primaryKey(),
  routeId: integer('route_id').references(() => routes.id, { onDelete: 'cascade' }).notNull(),
  price: decimal('price', { precision: 10, scale: 2 }).notNull(),
  fetchedAt: timestamp('fetched_at').defaultNow().notNull(),
}, (table) => ({
  routeIdIdx: index('idx_price_history_route_id').on(table.routeId),
  fetchedAtIdx: index('idx_price_history_fetched_at').on(table.fetchedAt),
}));

export const alerts = pgTable('alerts', {
  id: serial('id').primaryKey(),
  routeId: integer('route_id').references(() => routes.id, { onDelete: 'cascade' }).notNull(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  type: varchar('type', { length: 50 }).notNull(),
  triggeredAt: timestamp('triggered_at').defaultNow().notNull(),
  priceAtTrigger: decimal('price_at_trigger', { precision: 10, scale: 2 }).notNull(),
  sent: boolean('sent').default(false).notNull(),
}, (table) => ({
  routeIdIdx: index('idx_alerts_route_id').on(table.routeId),
  userIdIdx: index('idx_alerts_user_id').on(table.userId),
  sentIdx: index('idx_alerts_sent').on(table.sent),
}));

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Route = typeof routes.$inferSelect;
export type NewRoute = typeof routes.$inferInsert;
export type PriceHistory = typeof priceHistory.$inferSelect;
export type NewPriceHistory = typeof priceHistory.$inferInsert;
export type Alert = typeof alerts.$inferSelect;
export type NewAlert = typeof alerts.$inferInsert;
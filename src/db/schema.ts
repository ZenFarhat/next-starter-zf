import { boolean, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core"

export const usersTable = pgTable("users_table", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  created_at: timestamp("created_at").notNull().defaultNow(),
  auth_id: text("auth_id").notNull().unique(),
  cancelled_at: timestamp("cancelled_at"),
  subscribed_at: timestamp("subscribed_at"),
  stripe_customer_id: text("stripe_customer_id").unique(),
  override_subscription: boolean("override_subscription").default(false),
})

export type InsertUser = typeof usersTable.$inferInsert
export type SelectUser = typeof usersTable.$inferSelect

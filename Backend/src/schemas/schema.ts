import { sqliteTable, text, real } from "drizzle-orm/sqlite-core";

export const userSchema = sqliteTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  createdAt: text("created_at").notNull(),
});

export type UserSchema = typeof userSchema.$inferSelect;

export const categorySchema = sqliteTable("categories", {
  id: text("id").primaryKey(),
  user_id: text("user_id")
    .notNull()
    .references(() => userSchema.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
});

export type CategorySchema = typeof categorySchema.$inferSelect;

export const expenseSchema = sqliteTable("expenses", {
  id: text("id").primaryKey(),
  user_id: text("user_id")
    .notNull()
    .references(() => userSchema.id, { onDelete: "cascade" }),
  category_id: text("category_id")
    .notNull()
    .references(() => categorySchema.id, { onDelete: "set null" }),
  amount: real("amount").notNull(),
  description: text("description"),
  date: text("date").notNull(),
});

export type ExpenseSchema = typeof expenseSchema.$inferSelect;

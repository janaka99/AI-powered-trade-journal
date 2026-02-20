import {
  boolean,
  index,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

import { user } from "./auth-schema";

export const tradeAccountTypeEnum = pgEnum("trade_account_type", [
  "real",
  "demo",
  "backtest",
]);

export const tradeAccount = pgTable(
  "trade_account",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    broker: text("broker"),
    type: tradeAccountTypeEnum("type").notNull(),
    balance: numeric("balance", { precision: 18, scale: 2 }).notNull(),
    currency: text("currency").default("USD").notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    index("trade_account_user_id_idx").on(table.userId),
    uniqueIndex("trade_account_user_name_unique").on(table.userId, table.name),
  ],
);

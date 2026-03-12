import {
  boolean,
  index,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

import { user } from "./auth-schema";
import { tradeAccount } from "./trade-account-schema";
import { media } from "./media-schema";

export const tradeDirectionEnum = pgEnum("trade_direction", ["long", "short"]);

export const trade = pgTable(
  "trade",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accountId: text("account_id")
      .notNull()
      .references(() => tradeAccount.id, { onDelete: "cascade" }),
    symbol: text("symbol").notNull(), // e.g., EUR/USD, AAPL, etc.
    direction: tradeDirectionEnum("direction").notNull(), // long or short
    entryPrice: numeric("entry_price", { precision: 18, scale: 5 }).notNull(),
    exitPrice: numeric("exit_price", { precision: 18, scale: 5 }),
    volume: numeric("volume", { precision: 18, scale: 8 }), // e.g., lot size or contract quantity
    entryTime: timestamp("entry_time").notNull(),
    exitTime: timestamp("exit_time"),
    risk: numeric("risk", { precision: 18, scale: 2 }), // percentage risk, can be positive or negative
    profit: numeric("profit", { precision: 18, scale: 2 }), // can be positive or negative
    swap: numeric("swap", { precision: 18, scale: 2 }).default("0"), // overnight swap/financing fees
    commissions: numeric("commissions", { precision: 18, scale: 2 }).default(
      "0",
    ), // trading commissions or fees
    notes: text("notes"),
    mediaId: text("media_id").references(() => media.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("trade_user_id_idx").on(table.userId),
    index("trade_account_id_idx").on(table.accountId),
    index("trade_symbol_idx").on(table.symbol),
  ],
);

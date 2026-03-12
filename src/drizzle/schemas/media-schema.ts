import { index, pgTable, text, timestamp } from "drizzle-orm/pg-core";

import { user } from "./auth-schema";

export const media = pgTable(
  "media",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    url: text("url").notNull(),
    type: text("type").notNull(), // mime type: image/png, image/jpeg, etc.
    filename: text("filename").notNull(),
    size: text("size"), // file size in bytes
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [index("media_user_id_idx").on(table.userId)],
);

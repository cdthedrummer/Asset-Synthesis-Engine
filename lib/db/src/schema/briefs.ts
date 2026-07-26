import {
  customType,
  pgTable,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

const bytea = customType<{ data: Buffer; notNull: false }>({
  dataType() {
    return "bytea";
  },
});

export const briefs = pgTable("briefs", {
  id: serial("id").primaryKey(),
  briefDate: text("brief_date").notNull().unique(), // YYYY-MM-DD
  headline: text("headline").notNull(),
  content: text("content").notNull(),
  audio: bytea("audio"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const insertBriefSchema = createInsertSchema(briefs).omit({
  id: true,
  createdAt: true,
});

export type Brief = typeof briefs.$inferSelect;
export type InsertBrief = z.infer<typeof insertBriefSchema>;

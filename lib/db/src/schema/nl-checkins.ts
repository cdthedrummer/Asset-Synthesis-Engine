import {
  integer,
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { nlBoards } from "./nl-boards";

export const nlCheckins = pgTable("nl_checkins", {
  id: serial("id").primaryKey(),
  boardId: integer("board_id")
    .notNull()
    .references(() => nlBoards.id, { onDelete: "cascade" }),
  note: text("note").notNull(), // what the user said happened, verbatim
  summary: text("summary").notNull(), // coach response: celebrate, re-score, name the dodge
  changes: jsonb("changes").notNull().default([]), // [{pinId, field, from, to, why}]
  dodged: text("dodged"), // the avoided item, named out loud
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const insertNlCheckinSchema = createInsertSchema(nlCheckins).omit({
  id: true,
  createdAt: true,
});

export type NlCheckin = typeof nlCheckins.$inferSelect;
export type InsertNlCheckin = z.infer<typeof insertNlCheckinSchema>;

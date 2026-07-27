import {
  boolean,
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

export const nlPins = pgTable("nl_pins", {
  id: serial("id").primaryKey(),
  boardId: integer("board_id")
    .notNull()
    .references(() => nlBoards.id, { onDelete: "cascade" }),
  title: text("title").notNull(), // shown in drill-down/breadcrumbs, never as a board headline
  verdict: text("verdict").notNull(), // start | schedule | skip | gethelp
  verdictWhy: text("verdict_why").notNull().default(""),
  difficulty: integer("difficulty").notNull(), // 1-10 personal difficulty
  impact: integer("impact").notNull(), // 1-10 twelve-month impact
  kind: text("kind").notNull(), // steps | pipeline | menu | table | calendar | bars | stat
  vizData: jsonb("viz_data").notNull().default({}), // template payload the pin renders from
  detail: jsonb("detail"), // second drill level {blocks:[...]}
  verifyYourself: boolean("verify_yourself").notNull().default(false),
  relatedPinIds: jsonb("related_pin_ids").notNull().default([]), // number[]
  lastTouchedAt: timestamp("last_touched_at", { withTimezone: true })
    .defaultNow()
    .notNull(), // drives recency sort + stamp
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const insertNlPinSchema = createInsertSchema(nlPins).omit({
  id: true,
  createdAt: true,
});

export type NlPin = typeof nlPins.$inferSelect;
export type InsertNlPin = z.infer<typeof insertNlPinSchema>;

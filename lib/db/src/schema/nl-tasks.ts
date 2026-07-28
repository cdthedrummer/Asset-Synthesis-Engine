import {
  boolean,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { nlBoards } from "./nl-boards";
import { nlPins } from "./nl-pins";

// Lightweight per-pin checklist items (Google Keep style). Deliberately
// separate from nl_moves: moves are the board's three 48-hour commitments,
// tasks are ad-hoc ticks the owner hangs off a single pin.
export const nlTasks = pgTable("nl_tasks", {
  id: serial("id").primaryKey(),
  boardId: integer("board_id")
    .notNull()
    .references(() => nlBoards.id, { onDelete: "cascade" }),
  pinId: integer("pin_id")
    .notNull()
    .references(() => nlPins.id, { onDelete: "cascade" }),
  label: text("label").notNull(),
  done: boolean("done").notNull().default(false),
  // Set when `done` flips true, cleared when it flips back. Ticking a box is
  // the cheapest real signal this app can collect, so it needs a timestamp.
  doneAt: timestamp("done_at", { withTimezone: true }),
  orderIndex: integer("order_index").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const insertNlTaskSchema = createInsertSchema(nlTasks).omit({
  id: true,
  createdAt: true,
});

export type NlTask = typeof nlTasks.$inferSelect;
export type InsertNlTask = z.infer<typeof insertNlTaskSchema>;

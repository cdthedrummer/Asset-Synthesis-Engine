import {
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

export const nlMoves = pgTable("nl_moves", {
  id: serial("id").primaryKey(),
  boardId: integer("board_id")
    .notNull()
    .references(() => nlBoards.id, { onDelete: "cascade" }),
  pinId: integer("pin_id").references(() => nlPins.id, {
    onDelete: "set null",
  }),
  title: text("title").notNull(),
  first48: text("first48").notNull(), // the concrete first step, 48-hour framing
  orderIndex: integer("order_index").notNull().default(0),
  state: text("state").notNull().default("pending"), // pending | done | skipped
  // Which round of three this move belongs to. Every check-in issues a fresh
  // set, so without this the board accumulates 4-6 moves all claiming
  // orderIndex 0-2 and "2 of 3 this round" can't be computed honestly.
  cycleIndex: integer("cycle_index").notNull().default(0),
  // When state left 'pending'. The progress sensor needs a timestamp, not just
  // a flag, to bucket real work into weeks.
  doneAt: timestamp("done_at", { withTimezone: true }),
  repKind: text("rep_kind").notNull().default("none"), // email | post | pitch | plan | message | none
  repDraft: text("rep_draft"), // latest draft from the do-it-with-me rep session
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const insertNlMoveSchema = createInsertSchema(nlMoves).omit({
  id: true,
  createdAt: true,
});

export type NlMove = typeof nlMoves.$inferSelect;
export type InsertNlMove = z.infer<typeof insertNlMoveSchema>;

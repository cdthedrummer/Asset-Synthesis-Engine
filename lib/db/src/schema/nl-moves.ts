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

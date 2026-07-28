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
import { nlMoves } from "./nl-moves";
import { nlPins } from "./nl-pins";

export const nlMessages = pgTable("nl_messages", {
  id: serial("id").primaryKey(),
  boardId: integer("board_id")
    .notNull()
    .references(() => nlBoards.id, { onDelete: "cascade" }),
  // both null = main/interview thread; pinId set = pin chat; moveId set = rep session
  pinId: integer("pin_id").references(() => nlPins.id, {
    onDelete: "cascade",
  }),
  moveId: integer("move_id").references(() => nlMoves.id, {
    onDelete: "cascade",
  }),
  role: text("role").notNull(), // user | assistant
  content: text("content").notNull(),
  // Tap-to-answer choices offered alongside an assistant turn (string[] | null).
  // Chat threads (pin/move/board) use this plus the `OPTIONS:` marker protocol.
  options: jsonb("options"),
  // How an interview question gets answered: {type:"text"|"single"|"multi"|
  // "rank"|"scale"|"image", ...payload for that type}. Interview turns only —
  // chat keeps using `options`, so its shape stays honestly `string[] | null`.
  // Always written through sanitizeAsk(); null means "just type".
  ask: jsonb("ask"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const insertNlMessageSchema = createInsertSchema(nlMessages).omit({
  id: true,
  createdAt: true,
});

export type NlMessage = typeof nlMessages.$inferSelect;
export type InsertNlMessage = z.infer<typeof insertNlMessageSchema>;

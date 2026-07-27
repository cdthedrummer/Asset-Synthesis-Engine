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

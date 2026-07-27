import {
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const nlBoards = pgTable("nl_boards", {
  id: serial("id").primaryKey(),
  token: text("token").notNull().unique(), // unguessable share token; the board's link identity
  kind: text("kind").notNull().default("real"), // real | demo
  name: text("name").notNull().default(""), // first name the board belongs to
  door: text("door").notNull(), // ambition | juggle
  goalText: text("goal_text").notNull(), // what they typed at the front door, verbatim
  aiFamiliarity: text("ai_familiarity"), // new | some | daily (learned in interview)
  craftComfort: text("craft_comfort"), // none | some | confident
  stage: text("stage").notNull().default("interview"), // interview | board
  statChips: jsonb("stat_chips"), // [{value,label,tone}]
  trajectory: jsonb("trajectory"), // {title,headline,unit,series,milestones}
  bet: jsonb("bet"), // {pinId,pinTitle,text}
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const insertNlBoardSchema = createInsertSchema(nlBoards).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type NlBoard = typeof nlBoards.$inferSelect;
export type InsertNlBoard = z.infer<typeof insertNlBoardSchema>;

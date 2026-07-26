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

export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  category: text("category").notNull(), // work | personal | life
  verdict: text("verdict").notNull(), // lead | delegate | partner | publish | park | kill
  status: text("status").notNull(),
  difficulty: integer("difficulty").notNull(), // 1-10
  upside: integer("upside").notNull(), // 1-10
  traction: integer("traction").notNull(), // 1-5
  energy: text("energy").notNull(), // drains | neutral | energizes
  oneLineTruth: text("one_line_truth").notNull(),
  nextProofPoint: text("next_proof_point").notNull(),
  aiRuling: text("ai_ruling").notNull().default(""),
  isActiveBet: boolean("is_active_bet").notNull().default(false),
  lastCheckinAt: timestamp("last_checkin_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const insertProjectSchema = createInsertSchema(projects).omit({
  id: true,
  createdAt: true,
});

export type Project = typeof projects.$inferSelect;
export type InsertProject = z.infer<typeof insertProjectSchema>;

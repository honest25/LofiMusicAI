import { pgTable, text, serial, integer, boolean, timestamp, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const tracks = pgTable("tracks", {
  id: serial("id").primaryKey(),
  originalFilename: text("original_filename").notNull(),
  originalPath: text("original_path").notNull(),
  lofiPath: text("lofi_path"),
  fileSize: integer("file_size").notNull(),
  duration: integer("duration"),
  status: text("status").notNull().default("uploading"), // uploading, processing, completed, error
  effects: json("effects"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertTrackSchema = createInsertSchema(tracks).omit({
  id: true, 
  lofiPath: true,
  status: true,
  createdAt: true
});

export const effectsSchema = z.object({
  vinylCrackle: z.number().min(0).max(100).default(65),
  reverb: z.number().min(0).max(100).default(40),
  beatSlowdown: z.number().min(0).max(100).default(25),
  bassBoost: z.number().min(0).max(100).default(50),
  bitCrushing: z.number().min(0).max(100).default(20),
  backgroundNoise: z.number().min(0).max(100).default(35)
});

export const updateEffectsSchema = z.object({
  trackId: z.number(),
  effects: effectsSchema
});

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Track = typeof tracks.$inferSelect;
export type InsertTrack = z.infer<typeof insertTrackSchema>;
export type Effects = z.infer<typeof effectsSchema>;
export type UpdateEffects = z.infer<typeof updateEffectsSchema>;

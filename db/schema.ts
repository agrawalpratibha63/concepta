import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const quizAttempts = sqliteTable("quiz_attempts", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  subject: text("subject").notNull(),
  chapter: text("chapter").notNull(),
  difficulty: text("difficulty").notNull(),
  score: integer("score").notNull(),
  total: integer("total").notNull(),
  percentage: integer("percentage").notNull(),
  durationSeconds: integer("duration_seconds"),
  answersJson: text("answers_json").notNull(),
  createdAt: text("created_at").notNull(),
}, (table) => [index("quiz_attempts_user_created_idx").on(table.userId, table.createdAt)]);

/*
  Warnings:

  - You are about to drop the column `ollamaModel` on the `Settings` table. All the data in the column will be lost.
  - You are about to drop the column `ollamaTemperature` on the `Settings` table. All the data in the column will be lost.
  - You are about to drop the column `ollamaUrl` on the `Settings` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Settings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "deepseekApiKey" TEXT,
    "deepseekModel" TEXT NOT NULL DEFAULT 'deepseek-chat',
    "deepseekTemperature" REAL NOT NULL DEFAULT 0.7,
    "aiSystemPrompt" TEXT,
    "reminderStagnantDays" INTEGER NOT NULL DEFAULT 5,
    "reminderWaitingClientDays" INTEGER NOT NULL DEFAULT 3,
    "reminderHighPriorityDays" INTEGER NOT NULL DEFAULT 2,
    "reminderOldTicketDays" INTEGER NOT NULL DEFAULT 14,
    "aiAnalysisInterval" INTEGER NOT NULL DEFAULT 4,
    "theme" TEXT NOT NULL DEFAULT 'dark',
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Settings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Settings" ("aiAnalysisInterval", "aiSystemPrompt", "id", "reminderHighPriorityDays", "reminderOldTicketDays", "reminderStagnantDays", "reminderWaitingClientDays", "theme", "updatedAt", "userId") SELECT "aiAnalysisInterval", "aiSystemPrompt", "id", "reminderHighPriorityDays", "reminderOldTicketDays", "reminderStagnantDays", "reminderWaitingClientDays", "theme", "updatedAt", "userId" FROM "Settings";
DROP TABLE "Settings";
ALTER TABLE "new_Settings" RENAME TO "Settings";
CREATE UNIQUE INDEX "Settings_userId_key" ON "Settings"("userId");
CREATE INDEX "Settings_userId_idx" ON "Settings"("userId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

/*
  Warnings:

  - Added the required column `userId` to the `Reminder` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `Settings` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `Ticket` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `TicketActivity` table without a default value. This is not possible if the table is not empty.

*/
-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Todo" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "ticketId" TEXT,
    "source" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "completedAt" DATETIME,
    "userId" TEXT NOT NULL,
    CONSTRAINT "Todo_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Todo_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "Ticket" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Reminder" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ticketId" TEXT,
    "remindAt" DATETIME NOT NULL,
    "message" TEXT,
    "repeat" TEXT,
    "triggered" BOOLEAN NOT NULL DEFAULT false,
    "autoType" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "userId" TEXT NOT NULL,
    CONSTRAINT "Reminder_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Reminder_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "Ticket" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Reminder" ("autoType", "createdAt", "id", "message", "remindAt", "repeat", "ticketId", "triggered", "updatedAt") SELECT "autoType", "createdAt", "id", "message", "remindAt", "repeat", "ticketId", "triggered", "updatedAt" FROM "Reminder";
DROP TABLE "Reminder";
ALTER TABLE "new_Reminder" RENAME TO "Reminder";
CREATE INDEX "Reminder_userId_idx" ON "Reminder"("userId");
CREATE TABLE "new_Settings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "ollamaUrl" TEXT NOT NULL DEFAULT 'http://localhost:11434',
    "ollamaModel" TEXT NOT NULL DEFAULT 'qwen2.5:7b',
    "ollamaTemperature" REAL NOT NULL DEFAULT 0.7,
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
INSERT INTO "new_Settings" ("aiAnalysisInterval", "aiSystemPrompt", "id", "ollamaModel", "ollamaTemperature", "ollamaUrl", "reminderHighPriorityDays", "reminderOldTicketDays", "reminderStagnantDays", "reminderWaitingClientDays", "theme", "updatedAt") SELECT "aiAnalysisInterval", "aiSystemPrompt", "id", "ollamaModel", "ollamaTemperature", "ollamaUrl", "reminderHighPriorityDays", "reminderOldTicketDays", "reminderStagnantDays", "reminderWaitingClientDays", "theme", "updatedAt" FROM "Settings";
DROP TABLE "Settings";
ALTER TABLE "new_Settings" RENAME TO "Settings";
CREATE UNIQUE INDEX "Settings_userId_key" ON "Settings"("userId");
CREATE INDEX "Settings_userId_idx" ON "Settings"("userId");
CREATE TABLE "new_Ticket" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'NEW',
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "tags" TEXT NOT NULL DEFAULT '[]',
    "aiNotes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "lastActivityAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    CONSTRAINT "Ticket_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Ticket" ("aiNotes", "createdAt", "description", "id", "lastActivityAt", "priority", "status", "tags", "title", "updatedAt") SELECT "aiNotes", "createdAt", "description", "id", "lastActivityAt", "priority", "status", "tags", "title", "updatedAt" FROM "Ticket";
DROP TABLE "Ticket";
ALTER TABLE "new_Ticket" RENAME TO "Ticket";
CREATE INDEX "Ticket_userId_idx" ON "Ticket"("userId");
CREATE TABLE "new_TicketActivity" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ticketId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    CONSTRAINT "TicketActivity_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "TicketActivity_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "Ticket" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_TicketActivity" ("content", "createdAt", "id", "ticketId", "type") SELECT "content", "createdAt", "id", "ticketId", "type" FROM "TicketActivity";
DROP TABLE "TicketActivity";
ALTER TABLE "new_TicketActivity" RENAME TO "TicketActivity";
CREATE INDEX "TicketActivity_userId_idx" ON "TicketActivity"("userId");
CREATE INDEX "TicketActivity_ticketId_idx" ON "TicketActivity"("ticketId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "Todo_userId_idx" ON "Todo"("userId");

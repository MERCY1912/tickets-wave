# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Tickets Wave Beta is a local desktop ticket management system with an integrated AI assistant (Ollama). It is a monorepo using npm workspaces with four main packages:

- **electron/** - Electron main process (desktop wrapper)
- **backend/** - Express API server with Prisma ORM
- **frontend/** - React + Vite application with TypeScript
- **shared/** - Shared TypeScript types

All data is stored locally in SQLite (`backend/prisma/tickets-wave.db`). No cloud communication required.

## Development Commands

### Root-level commands (run from project root)

```bash
# Install all dependencies
npm install
# or
pnpm install

# Run all workspaces in parallel (recommended for development)
npm run dev
# Individual services:
npm run dev:backend    # http://localhost:3001
npm run dev:frontend   # http://localhost:5173
npm run dev:electron   # Opens Electron window

# Database operations
npm run prisma:generate  # Generate Prisma client after schema changes
npm run prisma:migrate   # Run database migrations
npm run prisma:studio    # Open Prisma Studio for database inspection

# Building
npm run build           # Build all workspaces
npm run build:frontend  # Build only frontend
npm run build:backend   # Build only backend
npm run build:electron  # Build only electron

# Linting
npm run lint           # Lint all workspaces
```

### Backend-specific commands

```bash
cd backend
npm run dev    # Start with tsx watch
npm run build  # TypeScript compilation
npm run start  # Run production build
```

### Frontend-specific commands

```bash
cd frontend
npm run dev         # Vite dev server
npm run build       # tsc + vite build
npm run preview     # Preview production build
npm run type-check  # TypeScript type checking only
```

## Architecture

### Backend Architecture

The backend is an Express REST API with the following key components:

- **Entry point**: `backend/src/index.ts` - Initializes database, creates Express app, starts server on port 3001
- **App factory**: `backend/src/app.ts` - `createApp()` function that sets up middleware and routes
- **Routes**: All routes in `backend/src/routes/` - Express routers mounted at `/api/` prefix
- **Services**: `backend/src/services/ai.service.ts` - AI service for Ollama integration
- **Database**: `backend/src/utils/db.ts` - Prisma client singleton
- **Validation**: `backend/src/utils/validation.ts` - Zod schemas for request validation

Route structure:
- `/api/tickets` - Ticket CRUD operations
- `/api/activities` - Ticket activity log
- `/api/reminders` - Reminder management
- `/api/todos` - Todo management
- `/api/ai` - AI chat and analysis endpoints
- `/api/settings` - Application settings

All routes use Zod validation schemas from `validation.ts`. Error handling is centralized in `middleware/errorHandler.ts`.

### Frontend Architecture

The frontend is a React SPA using:

- **State management**: Zustand stores in `frontend/src/store/` (no Redux or Context API)
- **Routing**: React Router v6 with routes defined in `App.tsx`
- **API layer**: Centralized API clients in `frontend/src/services/api/`
  - `client.ts` - Base APIClient class with fetch wrapper
  - Domain-specific files (e.g., `tickets.api.ts`) that use the base client

Key pages:
- `/` - Dashboard with stats overview
- `/tickets` - Ticket list with filters
- `/tickets/:id` - Ticket details with activities
- `/kanban` - Drag-and-drop Kanban board
- `/calendar` - Calendar view of reminders
- `/ai` - AI chat interface
- `/settings` - App configuration

### State Management Pattern

Zustand stores follow a consistent pattern:

```typescript
interface State {
  // State properties
  items: Item[];
  loading: boolean;
  error: string | null;

  // Actions
  fetchItems: () => Promise<void>;
  createItem: (data: CreateInput) => Promise<Item>;
  // ...
}

export const useStore = create<State>((set) => ({
  // Initial state
  items: [],
  loading: false,
  error: null,

  // Actions
  fetchItems: async () => {
    set({ loading: true, error: null });
    try {
      const response = await apiClient.list();
      set({ items: response, loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },
  // ...
}));
```

### Database Schema

Prisma schema is in `backend/prisma/schema.prisma`. Key models:

- **Ticket** - Main ticket entity with status, priority, tags
- **TicketActivity** - Activity log for tickets (notes, status changes, etc.)
- **Reminder** - Time-based reminders linked to tickets or standalone
- **Todo** - Task items that can be linked to tickets
- **Settings** - Singleton settings row (id = "singleton")

After any schema change:
1. Run `npm run prisma:migrate` to create migration
2. Run `npm run prisma:generate` to regenerate Prisma client

### AI Integration

The AI service (`backend/src/services/ai.service.ts`) integrates with Ollama:

- Default URL: `http://localhost:11434`
- Default model: `qwen2.5:7b`
- Settings are stored in database and can be changed via Settings page

Key AI features:
- `chat()` - Conversational AI with ticket context
- `dailyBriefing()` - Morning report on active tickets
- `analyzeTickets()` - Analyze specific or all tickets
- `summarizeTicket()` - Generate ticket summary

The AI service builds context using `backend/src/utils/contextBuilder.ts` which fetches ticket details and activity history.

### Type Safety

Types are defined in two places:
- `shared/src/index.ts` - Shared types (used by backend and Electron IPC)
- `frontend/src/types/index.ts` - Frontend-specific types

These are kept in sync manually. When adding new types, update both locations.

### Electron Architecture

Electron wrapper:
- **Main process**: `electron/src/index.ts` - App lifecycle, window creation
- **Window creation**: `electron/src/main/mainWindow.ts` - Creates main window loading localhost:5173
- **Reminder service**: `electron/src/main/services/reminderService.ts` - Background reminder checking

Security: Electron restricts navigation to only allow localhost:5173 (see `web-contents-created` handler).

## Tech Stack

- **Desktop**: Electron 28+
- **Frontend**: React 18, TypeScript 5.3, Vite 5, Tailwind CSS, Framer Motion, @dnd-kit (drag-drop)
- **Backend**: Node.js 18+, Express 4, TypeScript 5.3
- **Database**: SQLite with Prisma ORM 5.8
- **State**: Zustand 4.4
- **Validation**: Zod 3.22
- **AI**: Ollama (local LLM)

## Ollama Setup for Development

The AI features require Ollama running locally:

1. Install Ollama from [ollama.com](https://ollama.com)
2. Pull a model: `ollama pull qwen2.5:7b` (or any compatible model)
3. Start Ollama service
4. Configure in Settings page if using different URL/model

## File Patterns

- Routes use async handlers and Zod validation
- Stores use Zustand with consistent loading/error state patterns
- Components use functional components with hooks
- All TypeScript, no JavaScript files
- ES modules (`"type": "module"`) throughout

## Port Configuration

- Backend API: `http://localhost:3001`
- Frontend dev server: `http://localhost:5173`
- Ollama: `http://localhost:11434` (default)

The frontend API client (`frontend/src/services/api/client.ts`) is hardcoded to `http://localhost:3001/api`. Change `API_BASE_URL` if backend runs on different port.

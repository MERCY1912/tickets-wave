# Tickets Wave Beta

A local desktop application for Support Managers to manage tickets with integrated AI assistant (Ollama). All data is stored locally - no internet communication required.

## Features

- **Ticket Management**: Create, update, and organize support tickets
- **Kanban Board**: Drag-and-drop interface to manage ticket statuses
- **Calendar View**: View reminders and upcoming deadlines
- **AI Assistant**: Integrated Ollama AI for ticket summaries, suggestions, and analysis
- **Smart Reminders**: Automatic reminders for stagnant, waiting, and high-priority tickets
- **Local-Only**: All data stored in SQLite, no cloud dependencies
- **Modern UI**: Dark mode by default with glassmorphism design

## Tech Stack

- **Desktop**: Electron
- **Frontend**: React, TypeScript, Tailwind CSS, Framer Motion
- **Backend**: Node.js, Express, Local REST API
- **Database**: SQLite + Prisma ORM
- **AI**: Ollama (Qwen 2.5/3 or DeepSeek-R1)

## Project Structure

```
tickets-wave-beta/
├── electron/       # Electron main process
├── backend/        # Express API + Prisma
├── frontend/       # React + Vite app
└── shared/         # Shared TypeScript types
```

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm (recommended) or npm
- Ollama running locally (for AI features)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd tickets-wave-beta
```

2. Install dependencies:
```bash
pnpm install
```

3. Initialize the database:
```bash
pnpm prisma:generate
pnpm prisma:migrate
```

### Development

Run all workspaces in parallel:
```bash
pnpm dev
```

Or run individually:
```bash
pnpm dev:backend    # http://localhost:3001
pnpm dev:frontend   # http://localhost:5173
pnpm dev:electron   # Opens Electron window
```

### Building

```bash
pnpm build
```

## Ollama Setup

1. Install Ollama from [ollama.com](https://ollama.com)
2. Pull a model (e.g., Qwen 2.5):
```bash
ollama pull qwen2.5:7b
```
3. Configure in Settings (default: `http://localhost:11434`)

## Usage

1. **Create Tickets**: Use the "New Ticket" button
2. **Manage Statuses**: Drag tickets in Kanban view or use status dropdown
3. **AI Chat**: Ask questions about your tickets in the AI Assistant panel
4. **Reminders**: Automatic reminders are generated based on your settings

## Settings

Configure in Settings page:
- Ollama URL and model
- AI system prompt
- Reminder rules (stagnant, waiting client, high priority days)
- Theme (light/dark)

## Keyboard Shortcuts

- `Escape` - Close modals
- `Enter` - Submit forms

## License

MIT

## Support

For issues and questions, please use the GitHub issue tracker.

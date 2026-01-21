import { createApp } from './app.js';
import { initializeDatabase } from './utils/db.js';

const PORT = process.env.PORT || 3001;

async function start() {
  try {
    // Initialize database (create default settings if needed)
    await initializeDatabase();
    console.log('Database initialized');

    // Create Express app
    const app = createApp();

    // Start server
    app.listen(PORT, () => {
      console.log(`Backend API server running on port ${PORT}`);
      console.log(`Health check: http://localhost:${PORT}/health`);
      console.log(`API base: http://localhost:${PORT}/api`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

start();

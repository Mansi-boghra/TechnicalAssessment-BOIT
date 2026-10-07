import dotenv from 'dotenv';
dotenv.config();

import { createApp } from './app.js';
import { initDatabase } from './db/index.js';

const PORT = process.env.PORT || 5000;

// Initialize database schema
initDatabase();

const app = createApp();

app.listen(PORT, () => {
  console.log(`Backend server is running on http://localhost:${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
});

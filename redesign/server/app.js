import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import apiRouter from './routes/api.js';
import DbConnection from './config/DbConnection.js';
import UserModel from './models/UserModel.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5002;

// Middleware
app.use(cors());
app.use(express.json());

// Logger middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.originalUrl}`);
  next();
});

// API Routes
app.use('/api', apiRouter);

// Serve static React files in production
const clientDistPath = path.join(__dirname, '../client/dist');
app.use(express.static(clientDistPath));

// Fallback for React Router in production
app.get('*', (req, res, next) => {
  if (req.originalUrl.startsWith('/api')) {
    return next();
  }
  res.sendFile(path.join(clientDistPath, 'index.html'), (err) => {
    if (err) {
      res.status(404).send('Vite build not found. Run client production build first.');
    }
  });
});

// Bootstrap server — Auto-connects to default DB on startup if configured.
const startServer = async () => {
  app.listen(PORT, async () => {
    console.log(`==================================================`);
    console.log(`🚀 IPOS5 Redesign Server is running on port ${PORT}`);
    console.log(`🔗 API Base URL: http://localhost:${PORT}/api`);
    if (process.env.DISABLE_AUTH === 'true') {
      console.log(`⚠️  AUTH DISABLED — mode development, JANGAN dipakai di production!`);
    }
    
    // Auto-connect to first connection profile on startup
    try {
      const connectionsFile = path.join(__dirname, 'config', 'connections.json');
      if (fs.existsSync(connectionsFile)) {
        const connections = JSON.parse(fs.readFileSync(connectionsFile, 'utf8'));
        if (connections.length > 0) {
          console.log(`🔌 Auto-connecting to default database profile: ${connections[0].name}...`);
          const result = await DbConnection.connect(connections[0]);
          console.log(`✅ ${result.message}`);
          await UserModel.seedDefaultUsers();
        }
      }
    } catch (e) {
      console.log(`⚠️ Auto-connect failed on start: ${e.message}`);
      console.log(`🔌 Waiting for MongoDB connection via UI...`);
    }
    console.log(`==================================================`);
  });
};

import fs from 'fs';

startServer();


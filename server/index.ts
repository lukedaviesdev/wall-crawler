import cors from 'cors';
import { config } from 'dotenv';
import express from 'express';

// Import API routes

import analyticsRouter from './routes/analytics';
import categoriesRouter from './routes/categories';
import syncRouter from './routes/sync';
import wallpapersRouter from './routes/wallpapers';

// Load environment variables
config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
  }),
);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((request, _res, next) => {
  console.log(
    `${new Date().toISOString()} - ${request.method} ${request.path}`,
  );
  next();
});

// Health check
app.get('/health', (_request, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'wall-crawler-api',
  });
});

// API routes
app.use('/api/categories', categoriesRouter);
app.use('/api/wallpapers', wallpapersRouter);
app.use('/api/sync', syncRouter);
app.use('/api/analytics', analyticsRouter);

// Error handling middleware
app.use(
  (
    error: Error,
    _request: express.Request,
    res: express.Response,
    _next: express.NextFunction,
  ) => {
    console.error('API Error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message:
        process.env.NODE_ENV === 'development'
          ? error.message
          : 'Something went wrong',
    });
  },
);

// 404 handler
app.use('*', (request, res) => {
  res.status(404).json({
    error: 'Not found',
    message: `Route ${request.method} ${request.originalUrl} not found`,
  });
});

// Start server with port fallback
const startServer = (port: number) => {
  const server = app.listen(port, () => {
    console.log(`🚀 Wall Crawler API server running on port ${port}`);
    console.log(`📍 Health check: http://localhost:${port}/health`);
    console.log(
      `🔗 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`,
    );
  });

  server.on('error', (error: any) => {
    if (error.code === 'EADDRINUSE') {
      console.log(
        `⚠️ Port ${port} is already in use, trying port ${port + 1}...`,
      );
      server.close();
      startServer(port + 1);
    } else {
      console.error('❌ Server error:', error);
      process.exit(1);
    }
  });

  return server;
};

const server = startServer(PORT);

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 Received SIGTERM, shutting down gracefully...');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('🛑 Received SIGINT, shutting down gracefully...');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

export default app;

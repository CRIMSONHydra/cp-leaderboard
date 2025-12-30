import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import connectDB from './config/database.js';
import { initRedis, closeRedis } from './config/redisStore.js';
import { stopCleanup } from './middlewares/authRateLimiter.js';
import routes from './routes/index.js';
import errorHandler from './middlewares/errorHandler.js';
import { apiLimiter, initRateLimitStore } from './middlewares/rateLimiter.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();

// Trust proxy configuration for deployments behind load balancers, reverse proxies, or CDNs
// This ensures correct client IP detection for rate limiting
// Options:
//   - true: trust all proxies (use only if you control all proxies)
//   - 1: trust first proxy hop
//   - 'loopback': trust localhost proxies
//   - Custom: set via TRUST_PROXY env var (e.g., '1', 'loopback', 'uniquelocal')
if (process.env.NODE_ENV === 'production') {
  const trustProxy = process.env.TRUST_PROXY || true;
  app.set('trust proxy', trustProxy === 'false' ? false : 
                         !isNaN(trustProxy) ? parseInt(trustProxy) : 
                         trustProxy);
  console.log(`Trust proxy configured: ${trustProxy}`);
}

// Initialize Redis for distributed rate limiting (optional)
// If REDIS_URL is set, uses Redis; otherwise falls back to in-memory store
await initRedis();
await initRateLimitStore();

// Connect to database - must succeed before server starts
try {
  await connectDB();
} catch (error) {
  console.error('Failed to connect to database:', error.message);
  process.exit(1);
}

// Middleware
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? true // Allow same-origin in production
    : ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true
}));
app.use(express.json());

// Rate limiting for API routes
app.use('/api', apiLimiter);

// API Routes
app.use('/api', routes);

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  const publicPath = path.join(__dirname, '../public');
  app.use(express.static(publicPath));

  // Handle SPA routing - serve index.html for non-API routes
  app.get('*', (req, res) => {
    res.sendFile(path.join(publicPath, 'index.html'));
  });
}

// Error handler
app.use(errorHandler);

const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully...');
  server.close(async () => {
    stopCleanup();
    await closeRedis();
    process.exit(0);
  });
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully...');
  server.close(async () => {
    stopCleanup();
    await closeRedis();
    process.exit(0);
  });
});

export default app;

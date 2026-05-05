import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './src/routes/authRoutes.js';
import leadRoutes from './src/routes/leadRoutes.js';
import taskRoutes from './src/routes/taskRoutes.js';
import scoreRoutes from './src/routes/scoreRoutes.js';
import dashboardRoutes from './src/routes/dashboardRoutes.js';
import webhookRoutes from './src/routes/webhookRoutes.js';
import { authenticateToken } from './src/middleware/auth.js';
import rateLimit from 'express-rate-limit';
import { startCronJobs } from './src/services/cronJobs.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  message: 'Too many requests, please try again later.'
});

app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:3000' }));
app.use(express.json());
app.use(limiter);

app.use('/api/auth', authRoutes);
app.use('/api/webhooks', webhookRoutes);
app.use('/api/leads', authenticateToken, leadRoutes);
app.use('/api/tasks', authenticateToken, taskRoutes);
app.use('/api/score-rules', authenticateToken, scoreRoutes);
app.use('/api/dashboard', authenticateToken, dashboardRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
    status: err.status || 500
  });
});

app.listen(PORT, () => {
  console.log(`🚀 CRM HUB Backend running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV}`);
  startCronJobs();
});

export default app;

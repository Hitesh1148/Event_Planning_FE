import express from 'express';
import http from 'http';
import cors from 'cors';
import { Server } from 'socket.io';
import { config } from './config';
import authRoutes from './routes/auth.routes';
import groupRoutes from './routes/group.routes';
import eventRoutes from './routes/event.routes';
import proposalRoutes from './routes/proposal.routes';
import votingRoutes from './routes/voting.routes';
import availabilityRoutes from './routes/availability.routes';
import budgetRoutes from './routes/budget.routes';
import recommendationRoutes from './routes/recommendation.routes';
import taskRoutes from './routes/task.routes';
import itineraryRoutes from './routes/itinerary.routes';
import expenseRoutes from './routes/expense.routes';
import changeRequestRoutes from './routes/changeRequest.routes';
import notificationRoutes from './routes/notification.routes';
import decisionHistoryRoutes from './routes/decisionHistory.routes';
import venueRoutes from './routes/venue.routes';
import { setupSocketIO } from './sockets/socketHandler';

const app = express();
const server = http.createServer(app);

// CORS configuration
app.use(cors({
  origin: true, // Allow frontend dev server
  credentials: true
}));

app.use(express.json());

// Setup Socket.IO
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});
const socketManager = setupSocketIO(io);

// Expose socketManager in app locals
app.locals.socketManager = socketManager;

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'PlanWise API',
    timestamp: new Date().toISOString(),
    demoMode: true
  });
});

// REST Routes
app.use('/api/auth', authRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/events', eventRoutes);
app.use('/api', proposalRoutes);
app.use('/api', votingRoutes);
app.use('/api', availabilityRoutes);
app.use('/api', budgetRoutes);
app.use('/api', recommendationRoutes);
app.use('/api', taskRoutes);
app.use('/api', itineraryRoutes);
app.use('/api', expenseRoutes);
app.use('/api', changeRequestRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api', decisionHistoryRoutes);
app.use('/api/venues', venueRoutes);

// Safe global error handler (No stack trace leakage)
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('[Error caught by global handler]:', err.message || err);
  res.status(err.status || 500).json({
    error: err.message || 'An unexpected server error occurred. Please try again.'
  });
});

if (process.env.NODE_ENV !== 'test' && !process.env.VERCEL) {
  server.listen(config.port, () => {
    console.log(`🚀 PlanWise Backend Server running on http://localhost:${config.port}`);
  });
}

export { app, server };
export default app;

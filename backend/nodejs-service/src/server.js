import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import amqp from 'amqplib';
import connectDB from './config/database.js';
import messageRoutes from './routes/messages.js';
import adminRoutes from './routes/adminRoutes.js';
import errorHandler from './middleware/errorHandler.js';
import setupSocketEvents from './socket/socketHandler.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Create HTTP server with Socket.io
const httpServer = createServer(app);
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: (origin, callback) => callback(null, true),
    credentials: true,
  },
  transports: ['websocket', 'polling'],
});

// Middleware
app.use(cors({
  origin: (origin, callback) => callback(null, true),
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Pass io instance to routes
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Messaging service is running',
    timestamp: new Date().toISOString(),
    websocket: true,
  });
});

// API Routes
app.use('/api/messages', messageRoutes);
app.use('/api/messages/admin', adminRoutes);

// Kept for backward compat (dev/testing); production flow goes through RabbitMQ
app.post('/internal/notify', (req, res) => {
  const { userId, notification } = req.body;
  if (!userId || !notification) {
    return res.status(400).json({ success: false, message: 'userId and notification required' });
  }
  io.to(`user_${String(userId)}`).emit('notification', notification);
  return res.json({ success: true });
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
  });
});

// Error Handler
app.use(errorHandler);

// Setup Socket.io event handlers
setupSocketEvents(io);

// ── RabbitMQ Consumer ────────────────────────────────────────────────────────
// Receives booking events from Spring Boot and pushes via Socket.io.
// Retries automatically on connection failure (RabbitMQ may start after this service).
const RABBITMQ_URI = process.env.RABBITMQ_URI || 'amqp://saf:saf123@rabbitmq:5672';
const NOTIFICATION_QUEUE = 'saf.notification.queue';
const BOOKING_EXCHANGE = 'saf.booking';

async function connectRabbitMQ(io) {
  const MAX_RETRIES = 12;
  const RETRY_DELAY_MS = 5000;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const connection = await amqp.connect(RABBITMQ_URI);
      const channel = await connection.createChannel();

      await channel.assertExchange(BOOKING_EXCHANGE, 'topic', { durable: true });
      await channel.assertQueue(NOTIFICATION_QUEUE, { durable: true });
      await channel.bindQueue(NOTIFICATION_QUEUE, BOOKING_EXCHANGE, 'booking.#');
      channel.prefetch(10);

      channel.consume(NOTIFICATION_QUEUE, (msg) => {
        if (!msg) return;
        try {
          const { userId, notification } = JSON.parse(msg.content.toString());
          io.to(`user_${String(userId)}`).emit('notification', notification);
          channel.ack(msg);
        } catch (err) {
          console.error('[RabbitMQ] Failed to process message:', err.message);
          channel.nack(msg, false, false);
        }
      });

      console.log('[RabbitMQ] Connected — consuming', NOTIFICATION_QUEUE);

      // Auto-reconnect when connection drops
      connection.on('close', () => {
        console.warn('[RabbitMQ] Connection closed — reconnecting in 5s...');
        setTimeout(() => connectRabbitMQ(io), RETRY_DELAY_MS);
      });
      connection.on('error', (err) => {
        console.error('[RabbitMQ] Connection error:', err.message);
      });

      return;
    } catch (err) {
      console.warn(`[RabbitMQ] Attempt ${attempt}/${MAX_RETRIES} failed: ${err.message}`);
      if (attempt < MAX_RETRIES) {
        await new Promise((r) => setTimeout(r, RETRY_DELAY_MS));
      }
    }
  }
  console.error('[RabbitMQ] All retries exhausted — notification delivery via queue disabled');
}

// Connect to MongoDB and start server
const startServer = async () => {
  try {
    await connectDB();
    httpServer.listen(PORT, () => {
      console.log(`Messaging service started on port ${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV}`);
      console.log(`WebSocket ready for connections`);
    });
    // Start RabbitMQ consumer after server is up (non-blocking — failures don't crash the service)
    connectRabbitMQ(io).catch((err) => console.error('[RabbitMQ] Init error:', err.message));
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

export default app;

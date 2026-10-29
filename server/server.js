import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// ES module fix for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env vars reliably regardless of launch directory
dotenv.config({ path: path.join(__dirname, '.env') });
dotenv.config();

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import { createServer } from 'http';
import { Server } from 'socket.io';
import connectDB from './config/db.js';
import { seedDefaultRoles } from './seedRoles.js';

// Connect to database safely
connectDB()
  .then(() => {
    seedDefaultRoles();
  })
  .catch((err) => {
    console.error('Initial DB seed connection notice:', err.message);
  });

const app = express();
// Enable trust proxy for secure cookies behind reverse proxies (Render, Railway, Heroku, AWS, Nginx)
app.set('trust proxy', 1);

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: (origin, callback) => callback(null, true),
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
  }
});

app.set('io', io);

// Middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(cookieParser());
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: false
}));
app.use(morgan('dev'));
app.use(cors({
  origin: (origin, callback) => callback(null, true),
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization', 'x-auth-token', 'Accept'],
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  exposedHeaders: ['Authorization']
}));

// Handle preflight for all routes
app.options('*', cors({
  origin: (origin, callback) => callback(null, true),
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization', 'x-auth-token', 'Accept'],
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS']
}));

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

import authRoutes from './routes/authRoutes.js';
import clubRoutes from './routes/clubRoutes.js';
import eventRoutes from './routes/eventRoutes.js';
import matchRoutes from './routes/matchRoutes.js';
import electionRoutes from './routes/electionRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import studentRoutes from './routes/studentRoutes.js';
import tournamentRoutes from './routes/tournamentRoutes.js';
import gameRoutes from './routes/gameRoutes.js';
import messageRoutes from './routes/messageRoutes.js';
import certificateRoutes from './routes/certificateRoutes.js';
import studentDirectoryRoutes from './routes/studentDirectoryRoutes.js';
import financeRoutes from './routes/financeRoutes.js';
import attendanceRoutes from './routes/attendanceRoutes.js';
import venueRoutes from './routes/venueRoutes.js';
import auditLogRoutes from './routes/auditLogRoutes.js';
import classFeeRoutes from './routes/classFeeRoutes.js';

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/clubs', clubRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/matches', matchRoutes);
app.use('/api/elections', electionRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/tournaments', tournamentRoutes);
app.use('/api/games', gameRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/certificates', certificateRoutes);
app.use('/api/student-directory', studentDirectoryRoutes);
app.use('/api/finance', financeRoutes);
app.use('/api/class-fees', classFeeRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/venues', venueRoutes);
app.use('/api/audit-logs', auditLogRoutes);

// Serve client static assets if build exists (enables full-stack single-service deployment)
const clientDistPath = path.join(__dirname, '../client/dist');
app.use(express.static(clientDistPath));

app.get('*', (req, res) => {
  if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) {
    return res.status(404).json({ message: 'API route not found' });
  }
  const indexPath = path.join(clientDistPath, 'index.html');
  res.sendFile(indexPath, (err) => {
    if (err) {
      res.send('Club Management API is running...');
    }
  });
});

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);
  
  socket.on('setup', (userData) => {
    socket.join(userData._id);
    console.log(`User ${userData._id} joined their notification room`);
  });

  socket.on('joinChat', (clubId) => {
    socket.join(clubId);
    console.log(`User joined club chat room: ${clubId}`);
  });

  socket.on('leaveChat', (clubId) => {
    socket.leave(clubId);
    console.log(`User left club chat room: ${clubId}`);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Global error handling middleware (handles Multer errors, file parse errors gracefully)
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  const status = err.status || err.statusCode || 500;
  res.status(status).json({
    message: err.message || 'Server encountered an unexpected error',
    error: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

const PORT = process.env.PORT || 5000;

httpServer.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`⚠️ Port ${PORT} is in use. Retrying or waiting for port release...`);
    setTimeout(() => {
      try {
        httpServer.close();
      } catch (closeErr) {}
      httpServer.listen(PORT, '0.0.0.0');
    }, 1500);
  } else {
    console.error('Server error:', err);
  }
});

httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});

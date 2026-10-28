import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import { createServer } from 'http';
import { Server } from 'socket.io';
import connectDB from './config/db.js';
import path from 'path';
import { fileURLToPath } from 'url';

// Load env vars
dotenv.config();

// ES module fix for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import { seedDefaultRoles } from './seedRoles.js';

// Connect to database
connectDB().then(() => {
  seedDefaultRoles();
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
app.use(express.json());
app.use(cookieParser());
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: false
}));
app.use(morgan('dev'));
app.use(cors({
  origin: (origin, callback) => callback(null, true),
  credentials: true
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
  
  // Join a room specific to the user's ID to receive private notifications
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

const PORT = process.env.PORT || 5000;

httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});

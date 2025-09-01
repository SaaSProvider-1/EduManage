import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { Server } from 'socket.io';
import { createServer } from 'http';
import cron from 'node-cron';
import studentRoutes from './routes/students.js';
import parentRoutes from './routes/parents.js';
import teacherRoutes from './routes/teachers.js';

// Import routes
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import batchRoutes from './routes/batches.js';
import attendanceRoutes from './routes/attendance.js';
import feeRoutes from './routes/fees.js';
import examRoutes from './routes/exams.js';
import notificationRoutes from './routes/notifications.js';
import dashboardRoutes from './routes/dashboard.js';

// Import middleware
import { authenticateToken } from './middleware/auth.js';
import { errorHandler } from './middleware/errorHandler.js';
import { setupSocketAuth } from './middleware/socketAuth.js';

// Import utilities
import { checkTeacherAttendance } from './utils/attendanceChecker.js';
import { initializeDatabase } from './utils/dbInit.js';

dotenv.config();

const app = express();
const server = createServer(app);
const PORT = process.env.PORT || 5000;

// Initialize Socket.IO
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Global middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:5173",
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000000000, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/auth', rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500000, // stricter limit for auth routes
}));

app.use(limiter);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Database connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/coaching-center')
.then(async () => {
  console.log('✅ MongoDB connected successfully');
  await initializeDatabase();
})
.catch((error) => {
  console.error('❌ MongoDB connection failed:', error);
  process.exit(1);
});

// Socket.IO setup
setupSocketAuth(io);

// Store socket connections
const connectedUsers = new Map();

io.on('connection', (socket) => {
  console.log(`User connected: ${socket.userId} (${socket.userRole})`);
  
  // Store user connection
  connectedUsers.set(socket.userId, {
    socketId: socket.id,
    role: socket.userRole,
    lastSeen: new Date()
  });

  // Join role-based rooms
  socket.join(socket.userRole);
  
  // Send online users list to admins
  if (socket.userRole === 'admin') {
    socket.emit('onlineUsers', Array.from(connectedUsers.entries()).map(([userId, data]) => ({
      userId,
      role: data.role,
      lastSeen: data.lastSeen
    })));
  }

  // Handle teacher check-in
  socket.on('teacherCheckIn', async (data) => {
    if (socket.userRole === 'teacher') {
      const { batchId, location } = data;
      // Emit to admins
      socket.to('admin').emit('teacherCheckedIn', {
        teacherId: socket.userId,
        batchId,
        location,
        timestamp: new Date()
      });
    }
  });

  // Handle attendance marking
  socket.on('attendanceMarked', (data) => {
    // Notify relevant users
    io.to('admin').emit('attendanceUpdate', data);
    if (data.parentIds) {
      data.parentIds.forEach(parentId => {
        const parentSocket = Array.from(connectedUsers.entries())
          .find(([userId]) => userId === parentId);
        if (parentSocket) {
          io.to(parentSocket[1].socketId).emit('attendanceNotification', data);
        }
      });
    }
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.userId}`);
    connectedUsers.delete(socket.userId);
    
    // Update online users for admins
    io.to('admin').emit('onlineUsers', Array.from(connectedUsers.entries()).map(([userId, data]) => ({
      userId,
      role: data.role,
      lastSeen: data.lastSeen
    })));
  });
});

// Make io available globally
app.set('io', io);
app.set('connectedUsers', connectedUsers);

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', authenticateToken, userRoutes);
app.use('/api/batches', authenticateToken, batchRoutes);
app.use('/api/attendance', authenticateToken, attendanceRoutes);
app.use('/api/fees', authenticateToken, feeRoutes);
app.use('/api/exams', authenticateToken, examRoutes);
app.use('/api/notifications', authenticateToken, notificationRoutes);
app.use('/api/dashboard', authenticateToken, dashboardRoutes);
app.use('/api/students', authenticateToken, studentRoutes);
app.use('/api/parents', authenticateToken, parentRoutes);
app.use('/api/teachers', authenticateToken, teacherRoutes);
// Error handling middleware
app.use(errorHandler);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    message: 'Route not found',
    path: req.originalUrl 
  });
});

// Cron jobs for automated tasks
// Check teacher attendance every 5 minutes
cron.schedule('*/5 * * * *', () => {
  checkTeacherAttendance(io);
});

// Clean up expired tokens daily at midnight
cron.schedule('0 0 * * *', async () => {
  try {
    const User = (await import('./models/User.js')).default;
    await User.updateMany(
      { 
        $or: [
          { 'emailVerificationExpires': { $lt: new Date() } },
          { 'passwordResetExpires': { $lt: new Date() } }
        ]
      },
      { 
        $unset: { 
          emailVerificationToken: 1,
          emailVerificationExpires: 1,
          passwordResetToken: 1,
          passwordResetExpires: 1
        }
      }
    );
    console.log('✅ Expired tokens cleaned up');
  } catch (error) {
    console.error('❌ Error cleaning up tokens:', error);
  }
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    mongoose.connection.close();
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  server.close(() => {
    mongoose.connection.close();
    process.exit(0);
  });
});

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
});
import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import { connectDB } from './db';
import config from './config';
import { Workspace } from './models/Workspace';
import { Member } from './models/User';
import { ConversationParticipant } from './models/ConversationParticipant';

// Import Route Packages
import authRoutes from './routes/authRoutes';
import startupRoutes from './routes/startupRoutes';
import projectRoutes from './routes/projectRoutes';
import validationRoutes from './routes/validationRoutes';
import crmRoutes from './routes/crmRoutes';
import documentRoutes from './routes/documentRoutes';
import aiRoutes from './routes/aiRoutes';
import workspaceRoutes from './routes/workspaceRoutes';
import chatRoutes from './routes/chatRoutes';
import notificationRoutes from './routes/notificationRoutes';
import taskRoutes from './routes/taskRoutes';
import teamRoutes from './routes/teamRoutes';
import milestoneRoutes from './routes/milestoneRoutes';

dotenv.config();

const app = express();
const server = http.createServer(app);

const isAllowedOrigin = (origin?: string) => {
  if (!origin) {
    return true;
  }

  if (!config.isProduction) {
    return true;
  }

  return config.corsOrigins.includes(origin);
};

const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      if (isAllowedOrigin(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error('CORS origin not allowed'));
    },
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'DELETE']
  }
});

// Attach io to the express app context
app.set('io', io);

const PORT = config.port;

// Middleware
const corsOptions = {
  origin: (origin: string | undefined, callback: (error: Error | null, allow?: boolean) => void) => {
    if (isAllowedOrigin(origin)) {
      callback(null, true);
      return;
    }

    callback(new Error('CORS origin not allowed'));
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-startup-id', 'x-workspace-id'],
  credentials: true
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use(express.json());


// Routes mapping
app.use('/api/auth', authRoutes);
app.use('/api/startup', startupRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/validation', validationRoutes);
app.use('/api/investors', crmRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/workspace', workspaceRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/notification', notificationRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/team', teamRoutes);
app.use('/api/milestones', milestoneRoutes);

// Register global error handling middleware
import { errorHandler } from './middleware/errorHandler';
app.use(errorHandler);

// Simple healthcheck
app.get('/health', (req, res) => {
  const dbReady = mongoose.connection.readyState === 1;
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date(),
    services: {
      api: 'up',
      database: dbReady
    }
  });
});

// Socket.io JWT authentication middleware
io.use((socket, next) => {
  try {
    const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(' ')[1];
    if (!token) {
      return next(new Error('Authentication error: Token missing'));
    }
    const decoded = jwt.verify(token, config.jwtSecret);
    socket.data.user = decoded;
    next();
  } catch (err) {
    return next(new Error('Authentication error: Invalid token'));
  }
});

// Global state to track online users (userId -> Set of socket.ids)
const onlineUsers = new Map<string, Set<string>>();

// Socket.io Real-time Event Rooms
io.on('connection', (socket) => {
  console.log(`Socket Client connected: ${socket.id} (user: ${socket.data.user?.id})`);

  // Track online presence on connection
  const connectedUserId = socket.data.user?.id;
  if (connectedUserId) {
    if (!onlineUsers.has(connectedUserId)) {
      onlineUsers.set(connectedUserId, new Set());
      io.emit('userOnline', { userId: connectedUserId });
    }
    onlineUsers.get(connectedUserId)!.add(socket.id);
    // Send list of all currently online user IDs to the newly connected client
    socket.emit('onlineUsersList', Array.from(onlineUsers.keys()));
  }

  // Join tenant workspace room
  socket.on('join_workspace', async (workspaceId: string) => {
    try {
      const userId = socket.data.user?.id;
      if (!userId) return;

      const workspace = await Workspace.findById(workspaceId);
      if (!workspace) return;

      const isMember = await Member.findOne({ userId, startupId: workspace.startupId });
      if (!isMember) {
        console.warn(`[Socket Warning] Client ${socket.id} (user: ${userId}) attempted unauthorized join to Workspace ${workspaceId}`);
        return;
      }

      socket.join(workspaceId);
      console.log(`Client ${socket.id} joined Workspace Room: ${workspaceId}`);
    } catch (err) {
      console.error(`Socket join_workspace error:`, err);
    }
  });

  // Broadcast live board updates
  socket.on('task_updated', async (data: { workspaceId: string; taskId: string; status: string }) => {
    try {
      const userId = socket.data.user?.id;
      if (!userId) return;

      const workspace = await Workspace.findById(data.workspaceId);
      if (!workspace) return;

      const isMember = await Member.findOne({ userId, startupId: workspace.startupId });
      if (!isMember) return;

      socket.to(data.workspaceId).emit('board_changed', data);
      console.log(`[Socket] Task ${data.taskId} updated to ${data.status} in Workspace: ${data.workspaceId}`);
    } catch (err) {
      console.error(`Socket task_updated error:`, err);
    }
  });

  const joinConversationHandler = async (conversationId: string) => {
    try {
      const userId = socket.data.user?.id;
      if (!userId) return;

      const participant = await ConversationParticipant.findOne({
        conversationId: new mongoose.Types.ObjectId(conversationId),
        userId: new mongoose.Types.ObjectId(userId),
        isActive: true
      });

      if (!participant) {
        console.warn(`[Socket Warning] Client ${socket.id} (user: ${userId}) attempted unauthorized join to Conversation ${conversationId}`);
        return;
      }

      socket.join(conversationId);
      console.log(`Client ${socket.id} joined conversation: ${conversationId}`);
    } catch (err) {
      console.error(`Socket joinConversation error:`, err);
    }
  };

  // Real-time Chat Workspace listeners
  socket.on('join-conversation', joinConversationHandler);
  socket.on('joinConversation', joinConversationHandler);

  socket.on('leaveConversation', (conversationId: string) => {
    socket.leave(conversationId);
    console.log(`Client ${socket.id} left conversation: ${conversationId}`);
  });

  socket.on('register-user', (userId: string) => {
    const authUserId = socket.data.user?.id;
    if (!authUserId || authUserId !== userId) {
      console.warn(`[Socket Warning] Client tried to register user ID: ${userId} but is authenticated as: ${authUserId}`);
      return;
    }
    socket.join(`user_${userId}`);
    console.log(`Client ${socket.id} registered personal room for user: ${userId}`);
    // Broadcast user presence
    socket.broadcast.emit('userOnline', { userId });
  });

  socket.on('typingStart', async (data: { conversationId: string; userId: string; userName: string }) => {
    try {
      const authUserId = socket.data.user?.id;
      if (!authUserId || authUserId !== data.userId) return;

      const participant = await ConversationParticipant.findOne({
        conversationId: new mongoose.Types.ObjectId(data.conversationId),
        userId: new mongoose.Types.ObjectId(authUserId),
        isActive: true
      });
      if (!participant) return;

      socket.to(data.conversationId).emit('typingStart', data);
    } catch (err) {
      console.error(err);
    }
  });

  socket.on('typingStop', async (data: { conversationId: string; userId: string; userName: string }) => {
    try {
      const authUserId = socket.data.user?.id;
      if (!authUserId || authUserId !== data.userId) return;

      const participant = await ConversationParticipant.findOne({
        conversationId: new mongoose.Types.ObjectId(data.conversationId),
        userId: new mongoose.Types.ObjectId(authUserId),
        isActive: true
      });
      if (!participant) return;

      socket.to(data.conversationId).emit('typingStop', data);
    } catch (err) {
      console.error(err);
    }
  });

  socket.on('messageSeen', async (data: { conversationId: string; userId: string }) => {
    try {
      const authUserId = socket.data.user?.id;
      if (!authUserId || authUserId !== data.userId) return;

      const participant = await ConversationParticipant.findOne({
        conversationId: new mongoose.Types.ObjectId(data.conversationId),
        userId: new mongoose.Types.ObjectId(authUserId),
        isActive: true
      });
      if (!participant) return;

      socket.to(data.conversationId).emit('messageSeen', data);
    } catch (err) {
      console.error(err);
    }
  });

  socket.on('disconnect', () => {
    console.log(`Socket Client disconnected: ${socket.id}`);
    const userId = socket.data.user?.id;
    if (userId && onlineUsers.has(userId)) {
      const userSockets = onlineUsers.get(userId)!;
      userSockets.delete(socket.id);
      if (userSockets.size === 0) {
        onlineUsers.delete(userId);
        io.emit('userOffline', { userId });
      }
    }
  });
});

// Start Server
const start = async () => {
  server.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
  });

  const dbConnected = await connectDB();
  if (!dbConnected) {
    console.warn('Server started without MongoDB. Database-backed features will remain unavailable until reconnection succeeds.');
  }
};

start();

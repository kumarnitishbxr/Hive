import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './db';
import config from './config';

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

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*', // For development simplicity, allow all origins
    methods: ['GET', 'POST', 'PATCH', 'DELETE']
  }
});

// Attach io to the express app context
app.set('io', io);

const PORT = config.port;

// Middleware
const corsOptions = {
  origin: (origin: any, callback: any) => {
    callback(null, true); // Dynamically allow incoming origin
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

// Simple healthcheck
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy', timestamp: new Date() });
});

// Socket.io Real-time Event Rooms
io.on('connection', (socket) => {
  console.log(`Socket Client connected: ${socket.id}`);

  // Join tenant workspace room
  socket.on('join_workspace', (workspaceId: string) => {
    socket.join(workspaceId);
    console.log(`Client ${socket.id} joined Workspace Room: ${workspaceId}`);
  });

  // Broadcast live board updates
  socket.on('task_updated', (data: { workspaceId: string; taskId: string; status: string }) => {
    socket.to(data.workspaceId).emit('board_changed', data);
    console.log(`[Socket] Task ${data.taskId} updated to ${data.status} in Workspace: ${data.workspaceId}`);
  });

  // Real-time Chat Workspace listeners
  socket.on('join-conversation', (conversationId: string) => {
    socket.join(conversationId);
    console.log(`Client ${socket.id} joined conversation room: ${conversationId}`);
  });

  socket.on('register-user', (userId: string) => {
    socket.join(`user_${userId}`);
    console.log(`Client ${socket.id} registered personal room for user: ${userId}`);
  });

  socket.on('send-message', (data: any) => {
    // Broadcast message to everyone in the conversation room
    io.to(data.conversationId).emit('receive-message', data);
  });

  socket.on('typing', (data: { conversationId: string; userId: string; userName: string; isTyping: boolean }) => {
    socket.to(data.conversationId).emit('typing', data);
  });

  socket.on('message-seen', (data: { conversationId: string; userId: string }) => {
    socket.to(data.conversationId).emit('message-seen', data);
  });

  socket.on('notification', (data: any) => {
    const receiverRoom = `user_${data.receiverId}`;
    io.to(receiverRoom).emit('notification', data);
  });

  socket.on('disconnect', () => {
    console.log(`Socket Client disconnected: ${socket.id}`);
  });
});

// Start Server
const start = async () => {
  await connectDB();
  server.listen(PORT, () => {
    console.log(`Server listening dynamically on http://localhost:${PORT}`);
  });
};

start();


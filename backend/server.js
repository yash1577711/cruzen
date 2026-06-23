require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const mongoSanitize = require('express-mongo-sanitize');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const connectDB = require('./config/db');
const TeamMessage = require('./models/TeamMessage');
const jwt = require('jsonwebtoken');
const User = require('./models/User');

const app = express();
const server = http.createServer(app);

const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:5173',
  'http://localhost:5175',
  'http://localhost:5174',
];

const io = new Server(server, {
  cors: { origin: allowedOrigins, credentials: true },
});

connectDB();

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({ origin: allowedOrigins, credentials: true, methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'], allowedHeaders: ['Content-Type', 'Authorization'] }));

const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 200, standardHeaders: true, legacyHeaders: false, message: { success: false, message: 'Too many requests, please try again later.' } });
app.use('/api/', limiter);

const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: process.env.NODE_ENV === 'development' ? 100 : 15, message: { success: false, message: 'Too many login attempts, please try again in 15 minutes.' } });

app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));
app.use(mongoSanitize());
app.use(compression());
if (process.env.NODE_ENV === 'development') app.use(morgan('dev'));

// Routes
app.use('/api/auth', authLimiter, require('./routes/auth'));
app.use('/api/user', require('./routes/user'));
// posRouter must come BEFORE main admin router — main router has requireAdminOrSubAdmin globally
const { posRouter } = require('./routes/admin');
app.use('/api/admin', posRouter);
app.use('/api/admin', require('./routes/admin'));
app.use('/api/services', require('./routes/services'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/leads', require('./routes/leads'));
app.use('/api/tracker', require('./routes/tracker'));
app.use('/api/chat', require('./routes/chat'));
app.use('/api/blog', require('./routes/blog'));
app.use('/api/popup', require('./routes/popup'));
app.use('/api/consultations', require('./routes/consultations'));
app.use('/api/site-config', require('./routes/siteConfig'));
app.use('/api/tickets', require('./routes/tickets'));
app.use('/api/requirements', require('./routes/requirements'));
app.use('/api/team-chat', require('./routes/teamChat'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/onboarding', require('./routes/onboarding'));
app.use('/api/audit', require('./routes/audit'));

app.get('/api/health', (_, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));
app.use((req, res) => res.status(404).json({ success: false, message: 'Route not found' }));
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.statusCode || 500).json({ success: false, message: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message });
});

// ── Socket.io — Live Team Chat ─────────────────────
const onlineUsers = new Map(); // userId -> socketId

io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error('No token'));
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('name avatar role');
    if (!user) return next(new Error('User not found'));
    socket.user = user;
    next();
  } catch (err) { next(new Error('Auth failed')); }
});

io.on('connection', (socket) => {
  const userId = socket.user._id.toString();
  onlineUsers.set(userId, socket.id);

  socket.on('join_room', (room) => {
    socket.join(room);
  });

  socket.on('leave_room', (room) => {
    socket.leave(room);
  });

  socket.on('send_message', async ({ room, message }) => {
    try {
      if (!message?.trim()) return;
      const senderRole = ['admin', 'sub-admin'].includes(socket.user.role) ? 'admin' :
        ['pos_head', 'team_member'].includes(socket.user.role) ? 'team' : 'client';
      const msg = await TeamMessage.create({
        room, sender: socket.user._id, senderRole,
        message: message.trim(), readBy: [socket.user._id],
      });
      const populated = await TeamMessage.findById(msg._id).populate('sender', 'name avatar role');
      socket.to(room).emit('new_message', populated);
    } catch (err) { console.error('Socket msg error:', err.message); }
  });

  socket.on('typing', ({ room, isTyping }) => {
    socket.to(room).emit('user_typing', { userId, name: socket.user.name, isTyping });
  });

  socket.on('disconnect', () => {
    onlineUsers.delete(userId);
  });
});

// Expose io instance for use in routes
app.set('io', io);
app.set('onlineUsers', onlineUsers);

// Init notification service with socket.io
const notificationService = require('./services/notificationService');
notificationService.init(io, onlineUsers);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server + Socket.io running on port ${PORT} [${process.env.NODE_ENV}]`));

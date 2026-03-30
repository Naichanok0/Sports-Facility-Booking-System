// server.js - MongoDB Version
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoose = require('mongoose');
const logger = require('./src/logger');

// Basic environment validation
if (!process.env.JWT_SECRET) {
  logger.error('❌ Missing required env: JWT_SECRET');
  process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 3089;

// ใช้ Helmet ปกติ (เราแยกสคริปต์ออกเป็นไฟล์ภายนอกแล้ว)
app.use(helmet());

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// ============ Middleware ============
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// Logger
app.use((req, res, next) => {
  console.log(`📨 ${req.method} ${req.url}`);
  logger.info(`${req.method} ${req.url}`);
  next();
});

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message: 'Too many requests, please try again later.'
    });
  }
});
app.use('/api/', limiter);

// ============ MongoDB Connection ============
async function connectMongo() {
  try {
    // Load all models first
    require('./src/models/User');
    require('./src/models/Facility');
    require('./src/models/SportType');
    require('./src/models/Reservation');
    require('./src/models/CheckIn');
    require('./src/models/Cancellation');
    require('./src/models/Queue');
    require('./src/models/WaitingRoom'); // ← Add this
    
    await mongoose.connect(process.env.MONGODB_URI, {
      maxPoolSize: 10,
      minPoolSize: 5
    });
    logger.info('✅ Connected to MongoDB');
  } catch (error) {
    logger.error('❌ MongoDB connection failed:', error.message);
    console.error('Full error:', error);
    process.exit(1);
  }
}

connectMongo();

// ============ Routes ============
// Auth Routes
app.use('/api/auth', require('./src/authRoutes'));

// API Routes
app.use('/api/users', require('./src/api/userApi'));
app.use('/api/sport-types', require('./src/api/sportTypeApi'));
app.use('/api/facilities', require('./src/api/facilityApi'));
app.use('/api/reservations', require('./src/api/reservationApi'));
app.use('/api/waiting-rooms', require('./src/api/waitingRoomApi'));
app.use('/api/queues', require('./src/api/queueApi'));
app.use('/api/checkins', require('./src/api/checkinApi'));
app.use('/api/cancellations', require('./src/api/cancellationApi'));

// Existing Routes
app.use('/api/user', require('./src/userRoutes'));
app.use('/api/facility-staff', require('./src/facilityStaffRoutes'));
app.use('/api/queue', require('./src/queueRoutes'));
app.use('/api', require('./src/routes'));
app.use('/api/admin', require('./src/admin'));

// ============ Health Check ============
app.get('/health', (req, res) => {
  res.json({ status: '🚀 API running', timestamp: new Date() });
});

// ============ Error Handler ============
app.use((err, req, res, next) => {
  logger.error('Error:', err);
  res.status(err.status || 500).json({ 
    success: false, 
    error: err.message,
    code: err.code || 'INTERNAL_ERROR'
  });
});

// ============ Global Error Handlers ============
// Catch unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('❌ Unhandled Rejection at:', promise);
  logger.error('Reason:', reason);
  console.error('❌ UNHANDLED REJECTION:', reason);
  // Don't exit - keep server alive
});

// Catch uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('❌ Uncaught Exception:', error.message);
  logger.error('Stack:', error.stack);
  console.error('❌ UNCAUGHT EXCEPTION:', error);
  // Don't exit - keep server alive
});

// ============ Start Server ============
const server = app.listen(PORT, () => {
  console.log(`🚀 Server listening on port ${PORT}`);
  logger.info(`🚀 API & Web running at http://localhost:${PORT}`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n⏹️  Shutting down gracefully...');
  try {
    await mongoose.disconnect();
    logger.info('MongoDB disconnected gracefully');
  } catch (err) {
    logger.error('Error disconnecting MongoDB:', err.message);
  }
  process.exit(0);
});

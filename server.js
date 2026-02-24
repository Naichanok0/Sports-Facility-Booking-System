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
  logger.info(`${req.method} ${req.url}`);
  next();
});

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests, please try again later.'
});
app.use('/api/', limiter);

// ============ MongoDB Connection ============
async function connectMongo() {
  try {
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

// ============ Start Server ============
const server = app.listen(PORT, () => {
  logger.info(`🚀 API & Web running at http://localhost:${PORT}`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  await mongoose.disconnect();
  logger.info('MongoDB disconnected');
  process.exit(0);
});

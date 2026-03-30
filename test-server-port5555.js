const express = require('express');
const mongoose = require('mongoose');

const app = express();
const PORT = 5555;  // Different port

// Simple middleware
app.use(express.json());
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Health endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date() });
});

// Start server
const server = app.listen(PORT, () => {
  console.log(`[${new Date().toISOString()}] ✅ Server listening on port ${PORT}`);
});

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/Booking', {
  maxPoolSize: 10,
  minPoolSize: 5
})
  .then(() => {
    console.log(`[${new Date().toISOString()}] ✅ MongoDB connected`);
  })
  .catch(err => {
    console.error(`[${new Date().toISOString()}] ❌ MongoDB error:`, err.message);
  });

// Graceful shutdown
let sigintCount = 0;
process.on('SIGINT', () => {
  sigintCount++;
  console.log(`\n[${new Date().toISOString()}] ⚠️  SIGINT received (${sigintCount})`);
  console.log(`Stack trace:`);
  console.trace();
  
  if (sigintCount >= 2) {
    console.log(`[${new Date().toISOString()}] ⏹️  Force shutdown`);
    process.exit(0);
  }
});

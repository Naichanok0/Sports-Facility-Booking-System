const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: { 
    type: String, 
    required: true, 
    unique: true 
  },
  email: { 
    type: String, 
    required: true, 
    unique: true 
  },
  passwordHash: { 
    type: String, 
    required: true 
  },
  // Personal Information
  firstName: {
    type: String,
    required: true
  },
  lastName: {
    type: String,
    required: true
  },
  studentId: {
    type: String,
    unique: true,
    required: true
  },
  barcode: {
    type: String,
    unique: true
  },
  phone: String,
  faculty: String,
  
  // Account Status
  role: { 
    type: String, 
    enum: ['user', 'facility-staff', 'admin'],
    default: 'user'
  },
  isActive: { 
    type: Boolean, 
    default: true 
  },
  
  // Ban System
  isBanned: {
    type: Boolean,
    default: false
  },
  bannedUntil: {
    type: Date
  },
  banReason: {
    type: String,
    default: null
  },
  bannedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  bannedAt: {
    type: Date,
    default: null
  },
  
  // No-show Tracking
  noShowCount: {
    type: Number,
    default: 0
  },
  
  // System Fields
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, { collection: 'users' });

// Indexes for faster queries
userSchema.index({ studentId: 1 });
userSchema.index({ barcode: 1 });
userSchema.index({ email: 1 });
userSchema.index({ role: 1 });

module.exports = mongoose.model('User', userSchema);

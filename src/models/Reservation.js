const mongoose = require('mongoose');

const reservationSchema = new mongoose.Schema({
  reservationNo: { 
    type: String, 
    unique: true, 
    required: true 
  },
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  facilityId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Facility', 
    required: true 
  },
  sportTypeId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'SportType', 
    required: true 
  },
  
  // Booking Details
  date: { 
    type: Date, 
    required: true 
  },
  startTime: { 
    type: String, 
    required: true 
  },
  endTime: { 
    type: String, 
    required: true 
  },
  durationHours: { 
    type: Number, 
    required: true 
  },
  playerCount: { 
    type: Number, 
    required: true 
  },
  
  // Status Tracking
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'checked-in', 'completed', 'cancelled', 'no-show'],
    default: 'pending'
  },
  
  // Check-in Information
  checkInTime: {
    type: Date
  },
  checkInMethod: {
    type: String,
    enum: ['barcode', 'manual'],
    default: null
  },
  checkedInBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // Cancellation Information
  cancellationReason: String,
  cancelledBy: { 
    type: String, 
    enum: ['user', 'admin'],
    default: null 
  },
  cancelledAt: Date,
  
  // Penalty System
  penaltyAmount: { 
    type: Number, 
    default: 0 
  },
  penaltyReason: String,
  
  // Additional Info
  notes: String,
  
  // Timestamps
  confirmedAt: Date,
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  updatedAt: { 
    type: Date, 
    default: Date.now 
  }
}, { collection: 'reservations' });

// Indexes for faster queries
reservationSchema.index({ userId: 1, date: -1 });
reservationSchema.index({ facilityId: 1, date: 1, startTime: 1 });
reservationSchema.index({ status: 1, createdAt: -1 });
reservationSchema.index({ reservationNo: 1 });

module.exports = mongoose.model('Reservation', reservationSchema);

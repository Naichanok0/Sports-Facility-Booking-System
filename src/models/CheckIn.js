const mongoose = require('mongoose');

const checkInSchema = new mongoose.Schema({
  reservationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Reservation',
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
  
  // Check-in Details
  checkInTime: {
    type: Date,
    default: Date.now
  },
  method: {
    type: String,
    enum: ['barcode', 'manual', 'qr-code'],
    required: true
  },
  
  // Who checked in the user
  checkedInBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Additional Info
  notes: String,
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  }
}, { collection: 'check_ins' });

// Indexes for faster queries
checkInSchema.index({ userId: 1, createdAt: -1 });
checkInSchema.index({ reservationId: 1 });
checkInSchema.index({ facilityId: 1, createdAt: -1 });
checkInSchema.index({ checkInTime: 1 });

module.exports = mongoose.model('CheckIn', checkInSchema);

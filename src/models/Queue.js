const mongoose = require('mongoose');

const queueSchema = new mongoose.Schema({
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
  
  // Queue Position
  position: {
    type: Number,
    required: true
  },
  
  // Queue Status
  status: {
    type: String,
    enum: ['waiting', 'approved', 'rejected', 'cancelled'],
    default: 'waiting'
  },
  
  // Player Info
  playerName: String,
  playerBarcode: String,
  
  // Joining Details
  joinedAt: {
    type: Date,
    default: Date.now
  },
  approvedAt: Date,
  rejectionReason: String,
  
  // Additional Info
  notes: String,
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, { collection: 'queues' });

// Indexes for faster queries
queueSchema.index({ reservationId: 1, position: 1 });
queueSchema.index({ userId: 1, status: 1 });
queueSchema.index({ facilityId: 1, joinedAt: -1 });
queueSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('Queue', queueSchema);

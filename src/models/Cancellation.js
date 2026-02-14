const mongoose = require('mongoose');

const cancellationSchema = new mongoose.Schema({
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
  cancelledBy: { 
    type: String, 
    enum: ['user', 'admin'], 
    required: true 
  },
  reason: String,
  penaltyApplied: { 
    type: Number, 
    default: 0 
  },
  penaltyReason: String,
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  approvedBy: mongoose.Schema.Types.ObjectId,
  approvedAt: Date,
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
}, { collection: 'cancellations' });

cancellationSchema.index({ reservationId: 1 });
cancellationSchema.index({ userId: 1, createdAt: -1 });
cancellationSchema.index({ status: 1 });

module.exports = mongoose.model('Cancellation', cancellationSchema);

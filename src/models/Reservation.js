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
  bookingDate: { 
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
  numPlayers: { 
    type: Number, 
    required: true 
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'cancelled', 'completed'],
    default: 'pending'
  },
  cancellationReason: String,
  cancelledBy: { 
    type: String, 
    enum: ['user', 'admin'],
    default: null 
  },
  cancelledAt: Date,
  penaltyAmount: { 
    type: Number, 
    default: 0 
  },
  notes: String,
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  confirmedAt: Date,
  updatedAt: { 
    type: Date, 
    default: Date.now 
  }
}, { collection: 'reservations' });

reservationSchema.index({ userId: 1, bookingDate: 1 });
reservationSchema.index({ facilityId: 1, bookingDate: 1, startTime: 1 });
reservationSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('Reservation', reservationSchema);

const mongoose = require('mongoose');

const WaitingRoomSchema = new mongoose.Schema({
  roomCode: { 
    type: String, 
    unique: true, 
    required: true,
    index: true 
  },
  name: { 
    type: String 
  },
  
  // Host info
  host: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  
  // Facility & Sport Type
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
    type: String 
  },
  
  // Players
  maxPlayers: { 
    type: Number, 
    default: 6 
  },
  players: [{
    userId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User' 
    },
    firstName: String,
    lastName: String,
    studentId: String,
    joinedAt: { 
      type: Date, 
      default: Date.now 
    }
  }],
  
  // Status & Expiry
  status: { 
    type: String, 
    enum: ['open', 'full', 'closed', 'cancelled', 'completed'],
    default: 'open' 
  },
  notes: { 
    type: String 
  },
  
  // Auto-expire after 10 minutes if not converted to reservation
  expiresAt: { 
    type: Date,
    default: () => new Date(Date.now() + 10 * 60 * 1000),
    index: { expireAfterSeconds: 0 }
  },
  
  // Link to created reservation (after closing waiting room)
  reservationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Reservation'
  },
  
}, {
  timestamps: true
});

// Pre-save hook to generate roomCode and update status
WaitingRoomSchema.pre('save', function(next) {
  if (!this.roomCode) {
    const ts = Date.now().toString().slice(-6);
    const rnd = Math.floor(Math.random() * 900 + 100);
    this.roomCode = `WR${ts}${rnd}`;
  }
  
  // Update status if players reached maxPlayers
  if (this.players && this.maxPlayers && this.players.length >= this.maxPlayers) {
    this.status = 'full';
  }
});

// Virtual for current player count
WaitingRoomSchema.virtual('currentPlayers').get(function() {
  return this.players ? this.players.length : 0;
});

// Virtual for available slots
WaitingRoomSchema.virtual('availableSlots').get(function() {
  return Math.max(0, this.maxPlayers - (this.players ? this.players.length : 0));
});

module.exports = mongoose.model('WaitingRoom', WaitingRoomSchema);

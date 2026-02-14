const mongoose = require('mongoose');

const facilitySchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true, 
    unique: true 
  },
  location: String,
  sportTypeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SportType',
    required: true
  },
  maxCapacity: { 
    type: Number, 
    required: true 
  },
  pricePerHour: { 
    type: Number, 
    default: 0 
  },
  isActive: { 
    type: Boolean, 
    default: true 
  },
  operatingHours: {
    openTime: String,
    closeTime: String
  },
  imageUrl: String,
  notes: String,
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  updatedBy: mongoose.Schema.Types.ObjectId,
  updatedAt: { 
    type: Date, 
    default: Date.now 
  }
}, { collection: 'facilities' });

facilitySchema.index({ sportTypeId: 1, isActive: 1 });

module.exports = mongoose.model('Facility', facilitySchema);

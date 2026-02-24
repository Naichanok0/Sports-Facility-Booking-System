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
  capacity: { 
    type: Number, 
    default: 10 
  },
  status: {
    type: String,
    enum: ['available', 'maintenance'],
    default: 'available'
  },
  description: String,
  isActive: { 
    type: Boolean, 
    default: true 
  },
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

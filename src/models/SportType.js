const mongoose = require('mongoose');

const sportTypeSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true, 
    unique: true 
  },
  description: String,
  icon: String,
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
}, { collection: 'sports_types' });

module.exports = mongoose.model('SportType', sportTypeSchema);

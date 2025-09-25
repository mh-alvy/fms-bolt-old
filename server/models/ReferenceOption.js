const mongoose = require('mongoose');

const referenceOptionSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    enum: ['reference', 'receivedBy']
  },
  value: {
    type: String,
    required: true,
    trim: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('ReferenceOption', referenceOptionSchema);
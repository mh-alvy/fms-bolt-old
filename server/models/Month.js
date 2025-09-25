const mongoose = require('mongoose');

const monthSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  monthNumber: {
    type: Number,
    required: true,
    min: 1,
    max: 999
  },
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  payment: {
    type: Number,
    required: true,
    min: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Month', monthSchema);
const mongoose = require('mongoose');

const enrollmentSchema = new mongoose.Schema({
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  startingMonthId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Month',
    required: true
  },
  endingMonthId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Month'
  }
});

const studentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  studentId: {
    type: String,
    required: true,
    unique: true
  },
  institutionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Institution',
    required: true
  },
  gender: {
    type: String,
    required: true,
    enum: ['Male', 'Female', 'Custom']
  },
  phone: {
    type: String,
    required: true,
    trim: true
  },
  guardianName: {
    type: String,
    required: true,
    trim: true
  },
  guardianPhone: {
    type: String,
    required: true,
    trim: true
  },
  batchId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Batch',
    required: true
  },
  enrolledCourses: [enrollmentSchema],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Student', studentSchema);
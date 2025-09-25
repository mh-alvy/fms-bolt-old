const mongoose = require('mongoose');

const monthPaymentSchema = new mongoose.Schema({
  monthId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Month',
    required: true
  },
  monthFee: {
    type: Number,
    required: true
  },
  paidAmount: {
    type: Number,
    required: true
  },
  previouslyPaid: {
    type: Number,
    default: 0
  },
  discountAmount: {
    type: Number,
    default: 0
  }
});

const paymentSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  studentName: {
    type: String,
    required: true
  },
  studentStudentId: {
    type: String,
    required: true
  },
  invoiceNumber: {
    type: String,
    required: true,
    unique: true
  },
  courses: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course'
  }],
  months: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Month'
  }],
  monthPayments: [monthPaymentSchema],
  totalAmount: {
    type: Number,
    required: true
  },
  discountAmount: {
    type: Number,
    default: 0
  },
  discountType: {
    type: String,
    enum: ['fixed', 'percentage'],
    default: 'fixed'
  },
  discountApplicableMonths: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Month'
  }],
  discountedAmount: {
    type: Number,
    required: true
  },
  paidAmount: {
    type: Number,
    required: true
  },
  dueAmount: {
    type: Number,
    required: true
  },
  reference: {
    type: String,
    trim: true
  },
  receivedBy: {
    type: String,
    required: true,
    trim: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Payment', paymentSchema);
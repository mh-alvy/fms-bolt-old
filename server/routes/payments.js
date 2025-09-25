const express = require('express');
const Payment = require('../models/Payment');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Generate invoice number
const generateInvoiceNumber = async () => {
  const year = new Date().getFullYear();
  const month = (new Date().getMonth() + 1).toString().padStart(2, '0');
  const count = await Payment.countDocuments();
  return `INV${year}${month}${(count + 1).toString().padStart(4, '0')}`;
};

// Get all payments
router.get('/', auth, async (req, res) => {
  try {
    const payments = await Payment.find()
      .populate('studentId')
      .populate('courses')
      .populate('months')
      .populate('monthPayments.monthId')
      .sort({ createdAt: -1 });
    res.json(payments);
  } catch (error) {
    console.error('Get payments error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get payments by student
router.get('/student/:studentId', auth, async (req, res) => {
  try {
    const payments = await Payment.find({ studentId: req.params.studentId })
      .populate('studentId')
      .populate('courses')
      .populate('months')
      .populate('monthPayments.monthId')
      .sort({ createdAt: -1 });
    res.json(payments);
  } catch (error) {
    console.error('Get payments by student error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get discounted payments
router.get('/discounted', auth, async (req, res) => {
  try {
    const payments = await Payment.find({ discountAmount: { $gt: 0 } })
      .populate('studentId')
      .populate('courses')
      .populate('months')
      .populate('monthPayments.monthId')
      .sort({ createdAt: -1 });
    res.json(payments);
  } catch (error) {
    console.error('Get discounted payments error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create payment
router.post('/', auth, async (req, res) => {
  try {
    const {
      studentId,
      studentName,
      studentStudentId,
      courses,
      months,
      monthPayments,
      totalAmount,
      discountAmount,
      discountType,
      discountApplicableMonths,
      discountedAmount,
      paidAmount,
      dueAmount,
      reference,
      receivedBy
    } = req.body;

    if (!studentId || !studentName || !studentStudentId || !courses || !months || !totalAmount || !paidAmount || !receivedBy) {
      return res.status(400).json({ message: 'All required fields must be provided' });
    }

    const invoiceNumber = await generateInvoiceNumber();

    const payment = new Payment({
      studentId,
      studentName,
      studentStudentId,
      invoiceNumber,
      courses,
      months,
      monthPayments: monthPayments || [],
      totalAmount,
      discountAmount: discountAmount || 0,
      discountType: discountType || 'fixed',
      discountApplicableMonths: discountApplicableMonths || [],
      discountedAmount,
      paidAmount,
      dueAmount,
      reference,
      receivedBy
    });

    await payment.save();
    await payment.populate('studentId');
    await payment.populate('courses');
    await payment.populate('months');
    await payment.populate('monthPayments.monthId');

    res.status(201).json(payment);
  } catch (error) {
    console.error('Create payment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
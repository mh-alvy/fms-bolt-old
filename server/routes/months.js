const express = require('express');
const Month = require('../models/Month');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Get all months
router.get('/', auth, async (req, res) => {
  try {
    const months = await Month.find().populate({
      path: 'courseId',
      populate: {
        path: 'batchId'
      }
    }).sort({ createdAt: -1 });
    res.json(months);
  } catch (error) {
    console.error('Get months error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get months by course
router.get('/course/:courseId', auth, async (req, res) => {
  try {
    const months = await Month.find({ courseId: req.params.courseId })
      .populate({
        path: 'courseId',
        populate: {
          path: 'batchId'
        }
      })
      .sort({ monthNumber: 1 });
    res.json(months);
  } catch (error) {
    console.error('Get months by course error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create month
router.post('/', auth, async (req, res) => {
  try {
    const { name, monthNumber, courseId, payment } = req.body;

    if (!name || !monthNumber || !courseId || payment === undefined) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    if (monthNumber < 1 || monthNumber > 999) {
      return res.status(400).json({ message: 'Month number must be between 1 and 999' });
    }

    if (payment < 0) {
      return res.status(400).json({ message: 'Payment amount must be non-negative' });
    }

    // Check if month already exists for this course
    const existingMonth = await Month.findOne({
      $or: [
        { name: { $regex: new RegExp(`^${name}$`, 'i') }, courseId },
        { monthNumber, courseId }
      ]
    });
    if (existingMonth) {
      return res.status(400).json({ message: 'Month with this name or number already exists for the selected course' });
    }

    const month = new Month({ name, monthNumber, courseId, payment });
    await month.save();
    await month.populate({
      path: 'courseId',
      populate: {
        path: 'batchId'
      }
    });

    res.status(201).json(month);
  } catch (error) {
    console.error('Create month error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update month
router.put('/:id', auth, async (req, res) => {
  try {
    const { name, payment } = req.body;
    const monthId = req.params.id;

    const month = await Month.findById(monthId);
    if (!month) {
      return res.status(404).json({ message: 'Month not found' });
    }

    if (name && name !== month.name) {
      // Check if another month has the same name for the same course
      const existingMonth = await Month.findOne({ 
        name: { $regex: new RegExp(`^${name}$`, 'i') },
        courseId: month.courseId,
        _id: { $ne: monthId }
      });
      if (existingMonth) {
        return res.status(400).json({ message: 'Month with this name already exists for this course' });
      }
      month.name = name;
    }

    if (payment !== undefined && payment >= 0) {
      month.payment = payment;
    }

    month.updatedAt = new Date();
    await month.save();
    await month.populate({
      path: 'courseId',
      populate: {
        path: 'batchId'
      }
    });

    res.json(month);
  } catch (error) {
    console.error('Update month error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete month
router.delete('/:id', auth, async (req, res) => {
  try {
    const monthId = req.params.id;

    const month = await Month.findByIdAndDelete(monthId);
    if (!month) {
      return res.status(404).json({ message: 'Month not found' });
    }

    res.json({ success: true, message: 'Month deleted successfully' });
  } catch (error) {
    console.error('Delete month error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
const express = require('express');
const Batch = require('../models/Batch');
const Course = require('../models/Course');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Get all batches
router.get('/', auth, async (req, res) => {
  try {
    const batches = await Batch.find().sort({ createdAt: -1 });
    res.json(batches);
  } catch (error) {
    console.error('Get batches error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create batch
router.post('/', auth, async (req, res) => {
  try {
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Batch name is required' });
    }

    // Check if batch already exists
    const existingBatch = await Batch.findOne({ name: { $regex: new RegExp(`^${name}$`, 'i') } });
    if (existingBatch) {
      return res.status(400).json({ message: 'Batch with this name already exists' });
    }

    const batch = new Batch({ name });
    await batch.save();

    res.status(201).json(batch);
  } catch (error) {
    console.error('Create batch error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update batch
router.put('/:id', auth, async (req, res) => {
  try {
    const { name } = req.body;
    const batchId = req.params.id;

    if (!name) {
      return res.status(400).json({ message: 'Batch name is required' });
    }

    // Check if another batch has the same name
    const existingBatch = await Batch.findOne({ 
      name: { $regex: new RegExp(`^${name}$`, 'i') },
      _id: { $ne: batchId }
    });
    if (existingBatch) {
      return res.status(400).json({ message: 'Batch with this name already exists' });
    }

    const batch = await Batch.findByIdAndUpdate(
      batchId,
      { name, updatedAt: new Date() },
      { new: true }
    );

    if (!batch) {
      return res.status(404).json({ message: 'Batch not found' });
    }

    res.json(batch);
  } catch (error) {
    console.error('Update batch error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete batch
router.delete('/:id', auth, async (req, res) => {
  try {
    const batchId = req.params.id;

    // Check if batch has courses
    const courseCount = await Course.countDocuments({ batchId });
    if (courseCount > 0) {
      return res.status(400).json({ message: 'Cannot delete batch with existing courses' });
    }

    const batch = await Batch.findByIdAndDelete(batchId);
    if (!batch) {
      return res.status(404).json({ message: 'Batch not found' });
    }

    res.json({ success: true, message: 'Batch deleted successfully' });
  } catch (error) {
    console.error('Delete batch error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
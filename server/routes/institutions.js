const express = require('express');
const Institution = require('../models/Institution');
const Student = require('../models/Student');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Get all institutions
router.get('/', auth, async (req, res) => {
  try {
    const institutions = await Institution.find().sort({ createdAt: -1 });
    res.json(institutions);
  } catch (error) {
    console.error('Get institutions error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create institution
router.post('/', auth, async (req, res) => {
  try {
    const { name, address } = req.body;

    if (!name || !address) {
      return res.status(400).json({ message: 'Institution name and address are required' });
    }

    // Check if institution already exists
    const existingInstitution = await Institution.findOne({ 
      name: { $regex: new RegExp(`^${name}$`, 'i') }
    });
    if (existingInstitution) {
      return res.status(400).json({ message: 'Institution with this name already exists' });
    }

    const institution = new Institution({ name, address });
    await institution.save();

    res.status(201).json(institution);
  } catch (error) {
    console.error('Create institution error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update institution
router.put('/:id', auth, async (req, res) => {
  try {
    const { name, address } = req.body;
    const institutionId = req.params.id;

    if (!name || !address) {
      return res.status(400).json({ message: 'Institution name and address are required' });
    }

    // Check if another institution has the same name
    const existingInstitution = await Institution.findOne({ 
      name: { $regex: new RegExp(`^${name}$`, 'i') },
      _id: { $ne: institutionId }
    });
    if (existingInstitution) {
      return res.status(400).json({ message: 'Institution with this name already exists' });
    }

    const institution = await Institution.findByIdAndUpdate(
      institutionId,
      { name, address, updatedAt: new Date() },
      { new: true }
    );

    if (!institution) {
      return res.status(404).json({ message: 'Institution not found' });
    }

    res.json(institution);
  } catch (error) {
    console.error('Update institution error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete institution
router.delete('/:id', auth, async (req, res) => {
  try {
    const institutionId = req.params.id;

    // Check if institution has students
    const studentCount = await Student.countDocuments({ institutionId });
    if (studentCount > 0) {
      return res.status(400).json({ message: 'Cannot delete institution with existing students' });
    }

    const institution = await Institution.findByIdAndDelete(institutionId);
    if (!institution) {
      return res.status(404).json({ message: 'Institution not found' });
    }

    res.json({ success: true, message: 'Institution deleted successfully' });
  } catch (error) {
    console.error('Delete institution error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
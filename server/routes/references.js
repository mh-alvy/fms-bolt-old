const express = require('express');
const ReferenceOption = require('../models/ReferenceOption');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Get reference options
router.get('/references', auth, async (req, res) => {
  try {
    const references = await ReferenceOption.find({ type: 'reference' }).sort({ createdAt: -1 });
    res.json(references.map(ref => ref.value));
  } catch (error) {
    console.error('Get references error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get received by options
router.get('/receivedBy', auth, async (req, res) => {
  try {
    const receivedByOptions = await ReferenceOption.find({ type: 'receivedBy' }).sort({ createdAt: -1 });
    res.json(receivedByOptions.map(option => option.value));
  } catch (error) {
    console.error('Get receivedBy options error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add reference option
router.post('/references', auth, async (req, res) => {
  try {
    const { value } = req.body;

    if (!value) {
      return res.status(400).json({ message: 'Reference value is required' });
    }

    // Check if reference already exists
    const existingReference = await ReferenceOption.findOne({ 
      type: 'reference',
      value: { $regex: new RegExp(`^${value}$`, 'i') }
    });
    if (existingReference) {
      return res.status(400).json({ message: 'Reference option already exists' });
    }

    const reference = new ReferenceOption({ type: 'reference', value });
    await reference.save();

    res.status(201).json({ success: true });
  } catch (error) {
    console.error('Add reference error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add received by option
router.post('/receivedBy', auth, async (req, res) => {
  try {
    const { value } = req.body;

    if (!value) {
      return res.status(400).json({ message: 'Received by value is required' });
    }

    // Check if option already exists
    const existingOption = await ReferenceOption.findOne({ 
      type: 'receivedBy',
      value: { $regex: new RegExp(`^${value}$`, 'i') }
    });
    if (existingOption) {
      return res.status(400).json({ message: 'Received by option already exists' });
    }

    const option = new ReferenceOption({ type: 'receivedBy', value });
    await option.save();

    res.status(201).json({ success: true });
  } catch (error) {
    console.error('Add received by error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete reference option
router.delete('/references/:index', auth, async (req, res) => {
  try {
    const references = await ReferenceOption.find({ type: 'reference' }).sort({ createdAt: -1 });
    const index = parseInt(req.params.index);
    
    if (index < 0 || index >= references.length) {
      return res.status(404).json({ message: 'Reference not found' });
    }

    await ReferenceOption.findByIdAndDelete(references[index]._id);
    res.json({ success: true });
  } catch (error) {
    console.error('Delete reference error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete received by option
router.delete('/receivedBy/:index', auth, async (req, res) => {
  try {
    const options = await ReferenceOption.find({ type: 'receivedBy' }).sort({ createdAt: -1 });
    const index = parseInt(req.params.index);
    
    if (index < 0 || index >= options.length) {
      return res.status(404).json({ message: 'Received by option not found' });
    }

    await ReferenceOption.findByIdAndDelete(options[index]._id);
    res.json({ success: true });
  } catch (error) {
    console.error('Delete received by error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
const express = require('express');
const Activity = require('../models/Activity');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Get all activities
router.get('/', auth, async (req, res) => {
  try {
    const activities = await Activity.find()
      .sort({ timestamp: -1 })
      .limit(100);
    res.json(activities);
  } catch (error) {
    console.error('Get activities error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create activity
router.post('/', auth, async (req, res) => {
  try {
    const { type, description, data } = req.body;

    if (!type || !description) {
      return res.status(400).json({ message: 'Type and description are required' });
    }

    const activity = new Activity({
      type,
      description,
      data: data || {},
      user: req.user.username
    });

    await activity.save();
    res.status(201).json(activity);
  } catch (error) {
    console.error('Create activity error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
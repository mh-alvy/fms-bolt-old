const express = require('express');
const Course = require('../models/Course');
const Month = require('../models/Month');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Get all courses
router.get('/', auth, async (req, res) => {
  try {
    const courses = await Course.find().populate('batchId').sort({ createdAt: -1 });
    res.json(courses);
  } catch (error) {
    console.error('Get courses error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get courses by batch
router.get('/batch/:batchId', auth, async (req, res) => {
  try {
    const courses = await Course.find({ batchId: req.params.batchId }).populate('batchId');
    res.json(courses);
  } catch (error) {
    console.error('Get courses by batch error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create course
router.post('/', auth, async (req, res) => {
  try {
    const { name, batchId } = req.body;

    if (!name || !batchId) {
      return res.status(400).json({ message: 'Course name and batch are required' });
    }

    // Check if course already exists in this batch
    const existingCourse = await Course.findOne({ 
      name: { $regex: new RegExp(`^${name}$`, 'i') },
      batchId 
    });
    if (existingCourse) {
      return res.status(400).json({ message: 'Course with this name already exists in the selected batch' });
    }

    const course = new Course({ name, batchId });
    await course.save();
    await course.populate('batchId');

    res.status(201).json(course);
  } catch (error) {
    console.error('Create course error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update course
router.put('/:id', auth, async (req, res) => {
  try {
    const { name } = req.body;
    const courseId = req.params.id;

    if (!name) {
      return res.status(400).json({ message: 'Course name is required' });
    }

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // Check if another course has the same name in the same batch
    const existingCourse = await Course.findOne({ 
      name: { $regex: new RegExp(`^${name}$`, 'i') },
      batchId: course.batchId,
      _id: { $ne: courseId }
    });
    if (existingCourse) {
      return res.status(400).json({ message: 'Course with this name already exists in this batch' });
    }

    course.name = name;
    course.updatedAt = new Date();
    await course.save();
    await course.populate('batchId');

    res.json(course);
  } catch (error) {
    console.error('Update course error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete course
router.delete('/:id', auth, async (req, res) => {
  try {
    const courseId = req.params.id;

    // Check if course has months
    const monthCount = await Month.countDocuments({ courseId });
    if (monthCount > 0) {
      return res.status(400).json({ message: 'Cannot delete course with existing months' });
    }

    const course = await Course.findByIdAndDelete(courseId);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    res.json({ success: true, message: 'Course deleted successfully' });
  } catch (error) {
    console.error('Delete course error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
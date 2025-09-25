const express = require('express');
const Student = require('../models/Student');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Generate student ID
const generateStudentId = async () => {
  const year = new Date().getFullYear().toString().substr(-2);
  const count = await Student.countDocuments();
  return `BTF${year}${(count + 1).toString().padStart(4, '0')}`;
};

// Get all students
router.get('/', auth, async (req, res) => {
  try {
    const students = await Student.find()
      .populate('institutionId')
      .populate('batchId')
      .populate('enrolledCourses.courseId')
      .populate('enrolledCourses.startingMonthId')
      .populate('enrolledCourses.endingMonthId')
      .sort({ createdAt: -1 });
    res.json(students);
  } catch (error) {
    console.error('Get students error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get student by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const student = await Student.findById(req.params.id)
      .populate('institutionId')
      .populate('batchId')
      .populate('enrolledCourses.courseId')
      .populate('enrolledCourses.startingMonthId')
      .populate('enrolledCourses.endingMonthId');
    
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    res.json(student);
  } catch (error) {
    console.error('Get student error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get student by student ID
router.get('/studentId/:studentId', auth, async (req, res) => {
  try {
    const student = await Student.findOne({ studentId: req.params.studentId })
      .populate('institutionId')
      .populate('batchId')
      .populate('enrolledCourses.courseId')
      .populate('enrolledCourses.startingMonthId')
      .populate('enrolledCourses.endingMonthId');
    
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    res.json(student);
  } catch (error) {
    console.error('Get student by studentId error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create student
router.post('/', auth, async (req, res) => {
  try {
    const { name, institutionId, gender, phone, guardianName, guardianPhone, batchId, enrolledCourses } = req.body;

    if (!name || !institutionId || !gender || !phone || !guardianName || !guardianPhone || !batchId) {
      return res.status(400).json({ message: 'All required fields must be provided' });
    }

    if (!enrolledCourses || enrolledCourses.length === 0) {
      return res.status(400).json({ message: 'At least one course enrollment is required' });
    }

    const studentId = await generateStudentId();

    const student = new Student({
      name,
      studentId,
      institutionId,
      gender,
      phone,
      guardianName,
      guardianPhone,
      batchId,
      enrolledCourses
    });

    await student.save();
    await student.populate('institutionId');
    await student.populate('batchId');
    await student.populate('enrolledCourses.courseId');
    await student.populate('enrolledCourses.startingMonthId');
    await student.populate('enrolledCourses.endingMonthId');

    res.status(201).json(student);
  } catch (error) {
    console.error('Create student error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update student
router.put('/:id', auth, async (req, res) => {
  try {
    const { name, institutionId, gender, phone, guardianName, guardianPhone, batchId, enrolledCourses } = req.body;
    const studentId = req.params.id;

    if (!name || !institutionId || !gender || !phone || !guardianName || !guardianPhone || !batchId) {
      return res.status(400).json({ message: 'All required fields must be provided' });
    }

    if (!enrolledCourses || enrolledCourses.length === 0) {
      return res.status(400).json({ message: 'At least one course enrollment is required' });
    }

    const student = await Student.findByIdAndUpdate(
      studentId,
      {
        name,
        institutionId,
        gender,
        phone,
        guardianName,
        guardianPhone,
        batchId,
        enrolledCourses,
        updatedAt: new Date()
      },
      { new: true }
    );

    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    await student.populate('institutionId');
    await student.populate('batchId');
    await student.populate('enrolledCourses.courseId');
    await student.populate('enrolledCourses.startingMonthId');
    await student.populate('enrolledCourses.endingMonthId');

    res.json(student);
  } catch (error) {
    console.error('Update student error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete student
router.delete('/:id', auth, async (req, res) => {
  try {
    const studentId = req.params.id;

    const student = await Student.findByIdAndDelete(studentId);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    res.json({ success: true, message: 'Student deleted successfully' });
  } catch (error) {
    console.error('Delete student error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
const express = require('express');
const mongoose = require('mongoose');
const User = require('../model/User');
const teacherOnly = require('../middleware/teacherMiddleware');
const Attendance = require('../model/Attendance');
const Marks = require('../model/Marks');

const router = express.Router();

// dashboard
router.get('/', teacherOnly, async (req, res) => {
  res.json({ message: `Welcome to your Teacher Dashboard, ${req.user.name}!` });
});

// student list 
router.get('/students', teacherOnly, async (req, res) => {
  try {
    const students = await User.find({ role: 'student' })
      .select('name email batch'); 
    res.json({ students });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// mark attendance
router.post('/attendance', teacherOnly, async (req, res) => {
  const { studentEmail, status } = req.body;

  const student = await User.findOne({ email: studentEmail, role: 'student' });
  if (!student) {
    return res.status(404).json({ message: 'Student not found' });
  }

  if (!student.attendance) student.attendance = [];
  student.attendance.push({ date: new Date(), status });
  await student.save();

  // socket concept
  req.io.to('student').emit('notification', {
    message: `📅 Attendance updated for today`,
  });

  res.json({ message: 'Attendance marked', student });
});


// upload marks 
router.post('/marks', teacherOnly, async (req, res) => {
  try {
    const { studentEmail, subject, marks } = req.body;
    if (!studentEmail || !subject || marks == null) {
      return res.status(400).json({ message: 'studentEmail, subject and marks are required' });
    }

    const student = await User.findOne({ email: studentEmail, role: 'student' });
    if (!student) return res.status(404).json({ message: 'Student not found' });

    const marksDoc = await Marks.create({
      student: student._id,
      subject,
      marks: Number(marks),
      uploadedBy: req.user._id
    });

    res.json({ message: 'Marks added', marks: marksDoc });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

const express = require('express');
const protectStudent = require('../middleware/studentMiddleware');
const User = require('../model/User');
const Attendance = require('../model/Attendance');
const Marks = require('../model/Marks');
const Notice = require('../model/Notice');

const router = express.Router();

// student dashboard
router.get('/', protectStudent, async (req, res) => {
    try {
        const student = await User.findById(req.user._id).select('name email batch role');
        if (!student) {
            return res.status(404).json({ message: 'Student not found' });
        }

        const attendanceRecords = await Attendance.find({ student: req.user._id }).select('date status');
        const marksRecords = await Marks.find({ student: req.user._id }).select('subject marks');
        const notices = await Notice.find().sort({ date: -1 }); 

        const attendanceObj = {};
        attendanceRecords.forEach(record => {
            const date = new Date(record.date).toLocaleDateString('en-IN');
            attendanceObj[date] = record.status;
        });

        const marksObj = {};
        marksRecords.forEach(record => {
            marksObj[record.subject] = record.marks;
        });

        const updatesObj = {};
        notices.forEach((record, index) => {
            updatesObj[`update_${index + 1}`] = {
                title: record.title,
                content: record.description,
                date: record.date
            };
        });

        res.json({
            student: {
                name: student.name,
                email: student.email,
                batch: student.batch,
                attendance: attendanceObj,
                marks: marksObj,
                updates: updatesObj
            }
        });

    } catch (err) {
        console.error('Error in student dashboard route:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;

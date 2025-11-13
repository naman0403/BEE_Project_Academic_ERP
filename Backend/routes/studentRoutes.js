const express = require('express');
const protectStudent = require('../middleware/studentMiddleware');
const User = require('../model/User');

const router = express.Router();

// Get Student Dashboard
router.get('/', protectStudent, async (req, res) => {
    try {
        const student = await User.findById(req.user._id)
            .select('name email batch attendance marks updates');

            const attendanceObj = {};
            student.attendance.forEach(record => {
            attendanceObj[record.date] = record.status;
        });

        const marksObj = {};
        student.marks.forEach(record => {
            marksObj[record.subject] = record.marks;
        });

        const updatesObj = {};
        student.updates.forEach((record, index) => {
            updatesObj[`update_${index + 1}`] = {
                title: record.title,
                content: record.content
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
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;

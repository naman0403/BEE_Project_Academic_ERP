const express = require('express');
const Attendance = require('../model/Attendance');
const Marks = require('../model/Marks');   
const User = require('../model/User');  
const mongoose = require('mongoose');

const router = express.Router();

router.get('/analytics/teacher/:teacherId', async (req, res) => {
    try {
        const teacherId = req.params.teacherId;
        const from = req.query.from ? new Date(req.query.from) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const to = req.query.to ? new Date(req.query.to) : new Date();

        // Attendance aggregation (uses markedBy)
        const attendanceAgg = await Attendance.aggregate([
            {
                $match: {
                    markedBy: new mongoose.Types.ObjectId(teacherId),
                    date: { $gte: from, $lte: to }
                }
            },
            {
                $group: {
                    _id: '$student',
                    presents: { $sum: { $cond: [{ $eq: ['$status', 'present'] }, 1, 0] } },
                    total: { $sum: 1 }
                }
            },
            {
                $project: {
                    studentId: '$_id',
                    presents: 1,
                    total: 1,
                    attendancePercent: { $multiply: [{ $divide: ['$presents', '$total'] }, 100] }
                }
            }
        ]);

        // Marks aggregation (uses uploadedBy)
        const marksAgg = await Marks.aggregate([
            {
                $match: {
                    uploadedBy: new mongoose.Types.ObjectId(teacherId),
                    date: { $gte: from, $lte: to }
                }
            },
            {
                $group: {
                    _id: '$student',
                    avgMarks: { $avg: '$marks' }
                }
            },
            {
                $project: { studentId: '$_id', avgMarks: 1 }
            }
        ]);

        // Merge data
        const byStudentMap = {};
        attendanceAgg.forEach(a => {
            byStudentMap[String(a.studentId)] = {
                studentId: a.studentId,
                attendancePercent: a.attendancePercent.toFixed(2),
                presents: a.presents,
                total: a.total
            };
        });

        marksAgg.forEach(m => {
            const sid = String(m.studentId);
            if (!byStudentMap[sid]) byStudentMap[sid] = { studentId: m.studentId };
            byStudentMap[sid].avgMarks = m.avgMarks ? Number(m.avgMarks.toFixed(2)) : null;
        });

        // Fetch student info
        const studentIds = Object.keys(byStudentMap).map(id => byStudentMap[id].studentId);
        const students = await User.find({ _id: { $in: studentIds }, role: 'student' }).select('name email batch');
        const studentById = {};
        students.forEach(s => { studentById[String(s._id)] = s; });

        const perStudent = Object.values(byStudentMap).map(item => ({
            studentId: item.studentId,
            name: studentById[String(item.studentId)] ? studentById[String(item.studentId)].name : null,
            email: studentById[String(item.studentId)] ? studentById[String(item.studentId)].email : null,
            batch: studentById[String(item.studentId)] ? studentById[String(item.studentId)].batch : null,
            attendancePercent: item.attendancePercent || 0,
            avgMarks: item.avgMarks || null,
            presents: item.presents || 0,
            totalSessions: item.total || 0
        }));

        // Compute overall stats
        const overallAttendance = perStudent.length
            ? (perStudent.reduce((s, x) => s + Number(x.attendancePercent), 0) / perStudent.length)
            : 0;
        const classAvgMarks = perStudent.length
            ? (perStudent.reduce((s, x) => s + (x.avgMarks || 0), 0) / perStudent.length)
            : 0;

        res.json({
            meta: { from, to, teacherId },
            overallAttendance: Number(overallAttendance.toFixed(2)),
            classAverageMarks: Number(classAvgMarks.toFixed(2)),
            perStudent
        });

    } catch (err) {
        console.error('Analytics error:', err);
        res.status(500).json({ error: 'Failed to compute analytics', details: err.message });
    }
});


module.exports = router;
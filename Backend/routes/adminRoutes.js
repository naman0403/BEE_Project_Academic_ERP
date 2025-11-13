const express = require("express");
const router = express.Router();
const admin = require("../middleware/adminMiddleware");
const Notice = require("../model/Notice");
const User = require("../model/User");

// student list
router.get("/students", admin, async (req, res) => {
  const students = await User.find({ role: "student" });
  res.json(students);
});

// assign batch
router.patch("/students/:id/batch", admin, async (req, res) => {
  const { batch } = req.body;
  const student = await User.findByIdAndUpdate(req.params.id, { batch }, { new: true });
  if (!student) return res.status(404).json({ message: "Student not found" });
  res.json({ message: "Batch assigned", student });
});

// send notice
router.post("/notice", admin, async (req, res) => {
  try {
    const { title, content } = req.body;

    if (!title || !content) {
      return res.status(400).json({ message: "Title and content are required" });
    }

    // Save notice in DB
    const notice = new Notice({
      title,
      content,
      createdBy: req.user.name,
    });
    await notice.save();

    // ✅ Emit a short real-time notification
    const io = req.app.get("io");
    io.emit("new-notice", {
      message: "🆕 New notice posted",
      title: notice.title,
    });

    res.status(201).json({ message: "Notice posted successfully", notice });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;

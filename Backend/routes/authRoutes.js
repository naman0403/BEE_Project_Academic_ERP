const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../model/User');
const sendEmail = require('../utils/sendEmail');
const protect = require('../middleware/authMiddleware');

const router = express.Router();

// Student Signup
router.post('/signup', async (req, res) => {
    const { name, email, password } = req.body;

    try {
        let user = await User.findOne({ email });
        if (user) return res.status(400).json({ message: 'Student already exists' });

        const hashedPassword = await bcrypt.hash(password, 10);
        user = new User({ name, email, password: hashedPassword });
        await user.save();

        res.status(201).json({ message: 'Student registered successfully' });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Admin Signup
router.post('/create-admin', async (req, res) => {
    const { name, email, password } = req.body;

    try {
        let user = await User.findOne({ email });
        if (user) return res.status(400).json({ message: 'Admin already exists' });

        const hashedPassword = await bcrypt.hash(password, 10);
        user = new User({ name, email, password: hashedPassword, role: 'admin' });
        await user.save();

        res.status(201).json({ message: 'Admin created successfully' });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Teacher Signup
router.post('/teacher/signup', async (req, res) => {
    const { name, email, password } = req.body;

    try {
        let user = await User.findOne({ email });
        if (user) return res.status(400).json({ message: 'User already exists' });

        const hashedPassword = await bcrypt.hash(password, 10);
        user = new User({ name, email, password: hashedPassword, role: 'teacher' });
        await user.save();

        res.status(201).json({ message: 'Teacher registered successfully' });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Login
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ message: 'Invalid credentials' });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

        const otp = Math.floor(1000 + Math.random() * 9000).toString();

        await sendEmail(user.email, "Your OTP Code", `Your OTP is ${otp}`);

        res.cookie('otpData', JSON.stringify({ email, otp }), {
            httpOnly: true,
            secure: false, 
            maxAge: 5 * 60 * 1000 
        });

        res.json({ message: 'OTP sent to your email' });

    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Otp-verify
router.post('/verify-otp', async (req, res) => {
    const { otp, email } = req.body; 

    if (!email) return res.status(400).json({ message: 'Email not provided' });
    if (!otp) return res.status(400).json({ message: 'OTP not provided' });

    try {
        const otpData = req.cookies.otpData;
        if (!otpData) return res.status(400).json({ message: 'OTP expired. Please login again' });

        const { otp: storedOtp } = JSON.parse(otpData);

        if (otp !== storedOtp) return res.status(400).json({ message: 'Invalid OTP' });

        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ message: 'User not found' });

        res.clearCookie('otpData');

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

        res.cookie('token', token, {
            httpOnly: true,
            secure: false,
            maxAge: 60 * 60 * 1000 
        });

        res.json({ message: 'Login successful with OTP', role: user.role });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});


// dashboard
router.get('/dashboard', protect, (req, res) => {
    res.json({ message: 'Welcome to the Dashboard', user: req.user });
});

// logout
router.post('/logout', (req, res) => {
    res.clearCookie('token');
    res.json({ message: 'Logged out successfully' });
});

module.exports = router;

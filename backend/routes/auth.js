const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const nodemailer = require('nodemailer');

const router = express.Router();

// Nodemailer transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Register endpoint

router.post('/register', async (req, res) => {
  const {
    email,
    password,
    firstName,
    lastName,
    birthDate,
    gender,
    address,
    city,
    zip
  } = req.body;
  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: 'Email already exists' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const verificationToken = jwt.sign({ email }, process.env.JWT_SECRET, { expiresIn: '1d' });

    const user = new User({
      email,
      password: hashedPassword,
      verificationToken,
      firstName,
      lastName,
      birthDate,
      gender,
      address,
      city,
      zip
    });
    await user.save();

    // Send verification email
    const url = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`;
    await transporter.sendMail({
      to: email,
      subject: 'Verify your email',
      html: `Click <a href="${url}">here</a> to verify your email.`
    });

    res.status(201).json({ message: 'User registered. Please verify your email.' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Email verification endpoint
router.get('/verify-email', async (req, res) => {
  const { token } = req.query;
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findOne({ email: decoded.email, verificationToken: token });
    if (!user) return res.status(400).json({ message: 'Invalid token' });
    user.isVerified = true;
    user.verificationToken = undefined;
    await user.save();
    res.json({ message: 'Email verified. You can continue registration.' });
  } catch (err) {
    res.status(400).json({ message: 'Invalid or expired token' });
  }
});

// Login endpoint
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });
    if (!user.isVerified) return res.status(400).json({ message: 'Email not verified' });
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

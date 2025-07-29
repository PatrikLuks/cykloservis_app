const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const router = express.Router();

// Uloží nebo aktualizuje heslo uživatele podle emailu
router.post('/save-password', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ message: 'Email a heslo jsou povinné.' });
  try {
    let user = await User.findOne({ email });
    if (!user) {
      user = new User({ email });
    }
    user.password = await bcrypt.hash(password, 10);
    await user.save();
    res.json({ message: 'Heslo bylo uloženo.' });
  } catch (err) {
    res.status(500).json({ message: 'Chyba serveru při ukládání hesla.' });
  }
});

const nodemailer = require('nodemailer');

// Nodemailer transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },
  tls: {
    rejectUnauthorized: false
  }
});


// Zapomenuté heslo - krok 1: odeslání kódu
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Uživatel s tímto emailem neexistuje.' });
    // Vygeneruj 6-místný kód
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    user.resetPasswordCode = code;
    await user.save();
    await transporter.sendMail({
      to: email,
      subject: 'Obnova hesla - ověřovací kód',
      html: `<p>Váš kód pro obnovu hesla: <b>${code}</b></p>`
    });
    res.json({ message: 'Kód byl odeslán na email.' });
  } catch (err) {
    console.error('FORGOT PASSWORD ERROR:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Zapomenuté heslo - krok 2: ověření kódu
router.post('/verify-reset-code', async (req, res) => {
  const { email, code } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user || !user.resetPasswordCode) return res.status(400).json({ message: 'Neplatný požadavek.' });
    if (user.resetPasswordCode !== code) return res.status(400).json({ message: 'Chybný kód.' });
    res.json({ message: 'Kód ověřen.' });
  } catch (err) {
    console.error('VERIFY RESET CODE ERROR:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Zapomenuté heslo - krok 3: nastavení nového hesla
router.post('/reset-password', async (req, res) => {
  const { email, code, newPassword } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user || !user.resetPasswordCode) return res.status(400).json({ message: 'Neplatný požadavek.' });
    if (user.resetPasswordCode !== code) return res.status(400).json({ message: 'Chybný kód.' });
    user.password = await bcrypt.hash(newPassword, 10);
    user.resetPasswordCode = undefined;
    await user.save();
    res.json({ message: 'Heslo bylo úspěšně změněno.' });
  } catch (err) {
    console.error('RESET PASSWORD ERROR:', err);
    res.status(500).json({ message: 'Server error' });
  }
});


// Register endpoint

// Nový endpoint: pošle 6-místný kód na email, pokud uživatel neexistuje nebo není ověřený
router.post('/register', async (req, res) => {
  const { email } = req.body;
  try {
    let user = await User.findOne({ email });
    if (user && user.isVerified) return res.status(400).json({ message: 'Účet s tímto emailem již existuje' });

    // Vygeneruj 6-místný kód
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    if (!user) {
      user = new User({ email, verificationCode: code, isVerified: false, finallyRegistered: false });
    } else {
      user.verificationCode = code;
      user.isVerified = false;
      if (typeof user.finallyRegistered === 'undefined') user.finallyRegistered = false;
    }
    await user.save();

    // Pošli email s kódem
    await transporter.sendMail({
      to: email,
      subject: 'Ověřovací kód',
      html: `<p>Váš ověřovací kód: <b>${code}</b></p>`
    });
    res.status(201).json({ message: 'Kód byl odeslán na email.' });
  } catch (err) {
    console.error('REGISTER ERROR:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Complete profile endpoint
router.post('/complete-profile', async (req, res) => {
  console.log('COMPLETE PROFILE REQ:', req.body);
  const { email, firstName, lastName, birthDate, gender, location } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Uživatel neexistuje.' });
    if (!user.isVerified) return res.status(400).json({ message: 'Nejprve ověřte svůj email.' });
    user.firstName = firstName;
    user.lastName = lastName;
    user.birthDate = birthDate;
    user.gender = gender;
    user.location = location;
    user.finallyRegistered = true;
    await user.save();
    // Odeslat uvítací e-mail
    try {
      await transporter.sendMail({
        to: email,
        subject: 'Vítejte v Cykloservisu!',
        html: `<h2>Vítejte, ${firstName || ''}!</h2><p>Váš účet byl úspěšně vytvořen. Jsme rádi, že jste s námi 🚲<br>Pokud budete mít jakýkoliv dotaz, neváhejte nás kontaktovat.</p>`
      });
    } catch (mailErr) {
      console.error('WELCOME EMAIL ERROR:', mailErr);
      // Nepřerušuj registraci kvůli chybě e-mailu
    }
    res.json({ message: 'Profil byl úspěšně uložen.' });
  } catch (err) {
    console.error('COMPLETE PROFILE ERROR:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Email verification endpoint
router.get('/verify-email', async (req, res) => {
  const { token } = req.query;
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('VERIFY: hledám email:', decoded.email, 'token:', token);
    const user = await User.findOne({ email: decoded.email, verificationToken: token });
    if (!user) {
      console.log('VERIFY: uživatel nenalezen nebo token neodpovídá');
      return res.status(400).json({ message: 'Invalid token' });
    }
    user.isVerified = true;
    user.verificationToken = undefined;
    await user.save();
    res.json({ message: 'Email verified. You can continue registration.' });
  } catch (err) {
    console.log('VERIFY: chyba při ověřování tokenu', err);
    res.status(400).json({ message: 'Invalid or expired token' });
  }
});

// Login endpoint
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Uživatel s tímto emailem neexistuje.' });
    if (!user.isVerified) return res.status(400).json({ message: 'Email není ověřen' });
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Nesprávné heslo' });
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, finallyRegistered: !!user.finallyRegistered });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Endpoint pro ověření 6-místného kódu
router.post('/verify-code', async (req, res) => {
  const { email, code } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Uživatel neexistuje.' });
    if (user.isVerified) return res.status(400).json({ message: 'Email již byl ověřen.' });
    if (!user.verificationCode || (user.verificationCode.trim() !== String(code).trim())) {
      return res.status(400).json({ message: 'Neplatný ověřovací kód.' });
    }
    user.isVerified = true;
    user.verificationCode = undefined;
    await user.save();
    res.json({ message: 'Email byl úspěšně ověřen.' });
  } catch (err) {
    console.error('VERIFY CODE ERROR:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

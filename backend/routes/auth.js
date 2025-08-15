const auditLog = require('../utils/auditLog');
const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Helper pro generování 6-místného kódu
function generateCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Wrapper pro async routy
function asyncHandler(fn) {
  return function (req, res, next) {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

// Helper pro validaci
function handleValidation(req, res) {
  const errors = require('express-validator').validationResult(req);
  if (!errors.isEmpty()) {
    res
      .status(400)
      .json({ error: 'Validation failed', code: 'VALIDATION_ERROR', details: errors.array() });
    return false;
  }
  return true;
}

// Jednotná password policy (min 6 znaků, alespoň 1 malé, 1 velké písmeno a 1 číslice)
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{6,}$/;

router.post(
  '/save-password',
  [
    body('email').isEmail().withMessage('Neplatný email'),
    body('password')
      .isLength({ min: 6 })
      .withMessage('Heslo musí mít alespoň 6 znaků')
      .matches(PASSWORD_REGEX)
      .withMessage('Heslo musí obsahovat malé písmeno, velké písmeno a číslici'),
  ],
  asyncHandler(async (req, res) => {
    if (!handleValidation(req, res)) return;
    const { email, password } = req.body;
    let user = await User.findOne({ email });
    if (!user) {
      user = new User({ email, password: await bcrypt.hash(password, 10) });
      await user.save();
      auditLog('create_user', email, { action: 'save-password' });
    } else {
      user.password = await bcrypt.hash(password, 10);
      await user.save();
      auditLog('update_password', email, { action: 'save-password' });
    }
    res.json({ message: 'Heslo bylo uloženo.' });
  })
);

const { sendMail } = require('../utils/mailer');

// Zapomenuté heslo - krok 1: odeslání kódu
router.post(
  '/forgot-password',
  [body('email').isEmail().withMessage('Neplatný email')],
  asyncHandler(async (req, res) => {
    if (!handleValidation(req, res)) return;
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: 'User not found', code: 'USER_NOT_FOUND' });
    const code = generateCode();
    user.resetPasswordCode = code;
    await user.save();
    await sendMail({
      to: email,
      subject: 'Obnova hesla - ověřovací kód',
      html: `<p>Váš kód pro obnovu hesla: <b>${code}</b></p>`,
    });
    res.json({ message: 'Kód byl odeslán na email.' });
  })
);

// Endpoint pro ověření resetovacího kódu
router.post(
  '/verify-reset-code',
  [
    body('email').isEmail().withMessage('Neplatný email'),
    body('code').isLength({ min: 6, max: 6 }).withMessage('Kód musí mít 6 znaků'),
  ],
  asyncHandler(async (req, res) => {
    if (!handleValidation(req, res)) return;
    const { email, code } = req.body;
    const user = await User.findOne({ email });
    if (!user || !user.resetPasswordCode)
      return res.status(400).json({ error: 'Invalid request', code: 'INVALID_REQUEST' });
    if (user.resetPasswordCode !== code)
      return res.status(400).json({ error: 'Invalid code', code: 'INVALID_CODE' });
    res.json({ message: 'Kód ověřen.' });
  })
);

// Zapomenuté heslo - krok 3: nastavení nového hesla
router.post(
  '/reset-password',
  [
    body('email').isEmail().withMessage('Neplatný email'),
    body('code').isLength({ min: 6, max: 6 }).withMessage('Kód musí mít 6 znaků'),
    body('newPassword')
      .isLength({ min: 6 })
      .withMessage('Heslo musí mít alespoň 6 znaků')
      .matches(PASSWORD_REGEX)
      .withMessage('Heslo musí obsahovat malé písmeno, velké písmeno a číslici'),
  ],
  asyncHandler(async (req, res) => {
    if (!handleValidation(req, res)) return;
    const { email, code, newPassword } = req.body;
    const user = await User.findOne({ email });
    if (!user || !user.resetPasswordCode)
      return res.status(400).json({ error: 'Invalid request', code: 'INVALID_REQUEST' });
    if (user.resetPasswordCode !== code)
      return res.status(400).json({ error: 'Invalid code', code: 'INVALID_CODE' });
    user.password = await bcrypt.hash(newPassword, 10);
    user.resetPasswordCode = undefined;
    await user.save();
    res.json({ message: 'Heslo bylo úspěšně změněno.' });
  })
);

// Register endpoint

// Nový endpoint: pošle 6-místný kód na email, pokud uživatel neexistuje nebo není ověřený
router.post(
  '/register',
  [body('email').isEmail().withMessage('Neplatný email')],
  asyncHandler(async (req, res) => {
    if (!handleValidation(req, res)) return;
    const { email } = req.body;
    let user = await User.findOne({ email });
    if (user && user.isVerified)
      return res.status(400).json({ error: 'Account already exists', code: 'ACCOUNT_EXISTS' });
    const code = generateCode();
    if (!user) {
      user = new User({
        email,
        verificationCode: code,
        isVerified: false,
        finallyRegistered: false,
      });
    } else {
      user.verificationCode = code;
      user.isVerified = false;
    }
    await user.save();
    auditLog('register', email, { action: 'register' });
    await sendMail({
      to: email,
      subject: 'Ověřovací kód',
      html: `<p>Váš ověřovací kód: <b>${code}</b></p>`,
    });
    res.status(201).json({ message: 'Kód byl odeslán na email.' });
  })
);

// Complete profile endpoint
router.post(
  '/complete-profile',
  [
    body('email').isEmail().withMessage('Neplatný email'),
    body('firstName').notEmpty().withMessage('Jméno je povinné'),
    body('lastName').notEmpty().withMessage('Příjmení je povinné'),
    body('birthDate').notEmpty().withMessage('Datum narození je povinné'),
    body('gender').notEmpty().withMessage('Pohlaví je povinné'),
    body('location').notEmpty().withMessage('Lokalita je povinná'),
  ],
  asyncHandler(async (req, res) => {
    if (!handleValidation(req, res)) return;
    const { email, firstName, lastName, birthDate, gender, location } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: 'User not found', code: 'USER_NOT_FOUND' });
    if (!user.isVerified)
      return res.status(400).json({ error: 'Email not verified', code: 'EMAIL_NOT_VERIFIED' });
    user.firstName = firstName;
    user.lastName = lastName;
    user.birthDate = birthDate;
    user.gender = gender;
    user.location = location;
    user.finallyRegistered = true;
    await user.save();
    try {
      await sendMail({
        to: email,
        subject: 'Vítejte v Cykloservisu!',
        html: `<h2>Vítejte, ${firstName || ''}!</h2><p>Váš účet byl úspěšně vytvořen. Jsme rádi, že jste s námi 🚲<br>Pokud budete mít jakýkoliv dotaz, neváhejte nás kontaktovat.</p>`,
      });
    } catch (mailErr) {
      console.error('WELCOME EMAIL ERROR:', mailErr);
    }
    res.json({ message: 'Profil byl úspěšně uložen.' });
  })
);

// Odstraněno: původní verify-email endpoint (nekompletní token flow nahrazen 6-místným kódem)

// Login endpoint
router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Neplatný email'),
    body('password').isLength({ min: 6 }).withMessage('Heslo musí mít alespoň 6 znaků'),
  ],
  asyncHandler(async (req, res) => {
    if (!handleValidation(req, res)) return;
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: 'User not found', code: 'USER_NOT_FOUND' });
    if (!user.isVerified)
      return res.status(400).json({ error: 'Email not verified', code: 'EMAIL_NOT_VERIFIED' });
    if (!user.password)
      return res
        .status(400)
        .json({ error: 'Password not set. Complete registration.', code: 'PASSWORD_NOT_SET' });
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(400).json({ error: 'Invalid credentials', code: 'INVALID_CREDENTIALS' });
    const token = jwt.sign({ id: user._id, role: user.role || 'user' }, process.env.JWT_SECRET, {
      expiresIn: '7d',
    });
    auditLog('login', email, { action: 'login' });
    res.json({ token, finallyRegistered: !!user.finallyRegistered });
  })
);

// Endpoint pro ověření 6-místného kódu
router.post(
  '/verify-code',
  [
    body('email').isEmail().withMessage('Neplatný email'),
    body('code').isLength({ min: 6, max: 6 }).withMessage('Kód musí mít 6 znaků'),
  ],
  asyncHandler(async (req, res) => {
    if (!handleValidation(req, res)) return;
    const { email, code } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: 'User not found', code: 'USER_NOT_FOUND' });
    if (user.isVerified)
      return res.status(400).json({ error: 'Email already verified', code: 'ALREADY_VERIFIED' });
    if (!user.verificationCode || user.verificationCode.trim() !== String(code).trim()) {
      return res.status(400).json({ error: 'Invalid code', code: 'INVALID_CODE' });
    }
    user.isVerified = true;
    user.verificationCode = undefined;
    await user.save();
    res.json({ message: 'Email byl úspěšně ověřen.' });
  })
);
module.exports = router;

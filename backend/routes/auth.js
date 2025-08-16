const auditLog = require('../utils/auditLog');
const express = require('express');
const router = express.Router();
const { body, validationResult, query } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { requireAuth } = require('../middleware/auth');

// Helper to derive a stable display name for UI
function deriveDisplayName(user) {
  if (!user) return 'Uživatel';
  const first = (user.firstName || '').trim();
  const last = (user.lastName || '').trim();
  const full = `${first} ${last}`.trim();
  if (full) return full;
  const email = (user.email || '').trim();
  if (email) {
    const local = email.split('@')[0];
    if (local) return local;
  }
  return 'Uživatel';
}

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
    res.status(400).json({ errors: errors.array() });
    return false;
  }
  return true;
}


router.post('/save-password',
  [
    body('email').isEmail().withMessage('Neplatný email'),
    body('password').isLength({ min: 6 }).withMessage('Heslo musí mít alespoň 6 znaků')
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
router.post('/forgot-password',
  [body('email').isEmail().withMessage('Neplatný email')],
  asyncHandler(async (req, res) => {
    if (!handleValidation(req, res)) return;
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Uživatel s tímto emailem neexistuje.' });
    const code = generateCode();
    user.resetPasswordCode = code;
    await user.save();
    await sendMail({
      to: email,
      subject: 'Obnova hesla - ověřovací kód',
      html: `<p>Váš kód pro obnovu hesla: <b>${code}</b></p>`
    });
    res.json({ message: 'Kód byl odeslán na email.' });
  })
);

// Endpoint pro ověření resetovacího kódu
router.post('/verify-reset-code',
  [
    body('email').isEmail().withMessage('Neplatný email'),
    body('code').isLength({ min: 6, max: 6 }).withMessage('Kód musí mít 6 znaků')
  ],
  asyncHandler(async (req, res) => {
    if (!handleValidation(req, res)) return;
    const { email, code } = req.body;
    const user = await User.findOne({ email });
    if (!user || !user.resetPasswordCode) return res.status(400).json({ message: 'Neplatný požadavek.' });
    if (user.resetPasswordCode !== code) return res.status(400).json({ message: 'Chybný kód.' });
    res.json({ message: 'Kód ověřen.' });
  })
);

// Zapomenuté heslo - krok 3: nastavení nového hesla
router.post('/reset-password',
  [
    body('email').isEmail().withMessage('Neplatný email'),
    body('code').isLength({ min: 6, max: 6 }).withMessage('Kód musí mít 6 znaků'),
    body('newPassword').isLength({ min: 6 }).withMessage('Heslo musí mít alespoň 6 znaků')
  ],
  asyncHandler(async (req, res) => {
    if (!handleValidation(req, res)) return;
    const { email, code, newPassword } = req.body;
    const user = await User.findOne({ email });
    if (!user || !user.resetPasswordCode) return res.status(400).json({ message: 'Neplatný požadavek.' });
    if (user.resetPasswordCode !== code) return res.status(400).json({ message: 'Chybný kód.' });
    user.password = await bcrypt.hash(newPassword, 10);
    user.resetPasswordCode = undefined;
    await user.save();
    res.json({ message: 'Heslo bylo úspěšně změněno.' });
  })
);

// Register endpoint

// Nový endpoint: pošle 6-místný kód na email, pokud uživatel neexistuje nebo není ověřený
router.post('/register',
  [body('email').isEmail().withMessage('Neplatný email')],
  asyncHandler(async (req, res) => {
    if (!handleValidation(req, res)) return;
    const { email } = req.body;
    let user = await User.findOne({ email });
    if (user && user.isVerified) return res.status(400).json({ message: 'Účet s tímto emailem již existuje' });
    const code = generateCode();
    if (!user) {
      user = new User({ email, verificationCode: code, isVerified: false, finallyRegistered: false });
    } else {
      user.verificationCode = code;
      user.isVerified = false;
    }
    await user.save();
    auditLog('register', email, { action: 'register' });
    await sendMail({
      to: email,
      subject: 'Ověřovací kód',
      html: `<p>Váš ověřovací kód: <b>${code}</b></p>`
    });
    res.status(201).json({ message: 'Kód byl odeslán na email.' });
  })
);

// Complete profile endpoint
router.post('/complete-profile',
  [
    body('email').isEmail().withMessage('Neplatný email'),
    body('firstName').notEmpty().withMessage('Jméno je povinné'),
    body('lastName').notEmpty().withMessage('Příjmení je povinné'),
    body('birthDate').notEmpty().withMessage('Datum narození je povinné'),
    body('gender').notEmpty().withMessage('Pohlaví je povinné'),
    body('location').notEmpty().withMessage('Lokalita je povinná')
  ],
  asyncHandler(async (req, res) => {
    if (!handleValidation(req, res)) return;
    const { email, firstName, lastName, birthDate, gender, location } = req.body;
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
    try {
      await sendMail({
        to: email,
        subject: 'Vítejte v Cykloservisu!',
        html: `<h2>Vítejte, ${firstName || ''}!</h2><p>Váš účet byl úspěšně vytvořen. Jsme rádi, že jste s námi 🚲<br>Pokud budete mít jakýkoliv dotaz, neváhejte nás kontaktovat.</p>`
      });
    } catch (mailErr) {
      console.error('WELCOME EMAIL ERROR:', mailErr);
    }
    res.json({ message: 'Profil byl úspěšně uložen.' });
  })
);

// Email verification endpoint
router.get('/verify-email',
  [query('token').notEmpty().withMessage('Token je povinný')],
  asyncHandler(async (req, res) => {
    if (!handleValidation(req, res)) return;
    const { token } = req.query;
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findOne({ email: decoded.email, verificationToken: token });
      user.isVerified = true;
      user.verificationToken = undefined;
      await user.save();
      res.json({ message: 'Email verified. You can continue registration.' });
    } catch (err) {
      res.status(400).json({ message: 'Invalid or expired token' });
    }
  })
);

// Login endpoint
router.post('/login',
  [
    body('email').isEmail().withMessage('Neplatný email'),
    body('password').isLength({ min: 6 }).withMessage('Heslo musí mít alespoň 6 znaků')
  ],
  asyncHandler(async (req, res) => {
    if (!handleValidation(req, res)) return;
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Uživatel s tímto emailem neexistuje.' });
    if (!user.isVerified) return res.status(400).json({ message: 'Email není ověřen' });
    if (!user.password) return res.status(400).json({ message: 'Uživatel nemá nastavené heslo. Dokončete registraci.' });
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Nesprávné heslo' });
    // Vložit do tokenu i email a displayName pro okamžité zobrazení bez čekání na /auth/me
    const displayName = deriveDisplayName(user);
    const rawId = user._id.toString();
    const fallbackCreated = user.createdAt || new Date(parseInt(rawId.substring(0,8),16)*1000);
    const token = jwt.sign({
      id: rawId,
      role: user.role || 'user',
      email: user.email,
      displayName,
      createdAt: fallbackCreated,
      registeredAt: fallbackCreated
    }, process.env.JWT_SECRET, { expiresIn: '7d' });
    auditLog('login', email, { action: 'login' });
    res.json({ token, finallyRegistered: !!user.finallyRegistered });
  })
);

// Endpoint pro ověření 6-místného kódu
router.post('/verify-code',
  [
    body('email').isEmail().withMessage('Neplatný email'),
    body('code').isLength({ min: 6, max: 6 }).withMessage('Kód musí mít 6 znaků')
  ],
  asyncHandler(async (req, res) => {
    if (!handleValidation(req, res)) return;
    const { email, code } = req.body;
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
  })
);
module.exports = router;

// Current user profile endpoint
router.get('/me', requireAuth, asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id).lean();
  if (!user) return res.status(404).json({ message: 'Uživatel nenalezen' });
  const firstName = user.firstName || '';
  const lastName = user.lastName || '';
  const fullName = `${firstName} ${lastName}`.trim();
  const displayName = deriveDisplayName(user);
  const rawId = user._id.toString();
  const fallbackCreated = user.createdAt || new Date(parseInt(rawId.substring(0,8),16)*1000);
  res.json({
  id: rawId,
  email: user.email,
    firstName,
    lastName,
    fullName,
    displayName,
    birthDate: user.birthDate || null,
    gender: user.gender || '',
    location: user.location || '',
  avatarUrl: user.avatarUrl || '',
    phoneCountryCode: user.phoneCountryCode || '',
    phoneNumber: user.phoneNumber || '',
    role: user.role || 'user',
  finallyRegistered: !!user.finallyRegistered,
  createdAt: fallbackCreated || null,
  registeredAt: fallbackCreated || null
  });
}));

// Update current user profile (partial)
router.patch('/me', requireAuth,
  [
    body('phoneCountryCode').optional().isString().isLength({ min: 1, max: 6 }),
    body('phoneNumber').optional().isString().matches(/^\d{4,15}$/).withMessage('Telefonní číslo musí obsahovat pouze číslice (4-15).'),
    body('firstName').optional().isString(),
    body('lastName').optional().isString(),
    body('birthDate').optional().isISO8601().toDate(),
    body('gender').optional().isString(),
    body('location').optional().isString()
  ],
  asyncHandler(async (req, res) => {
    if (!handleValidation(req, res)) return;
    const updates = {};
    const fields = ['phoneCountryCode','phoneNumber','firstName','lastName','birthDate','gender','location'];
    fields.forEach(f => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });
  const user = await User.findByIdAndUpdate(req.user.id, { $set: updates }, { new: true }).lean();
    if (!user) return res.status(404).json({ message: 'Uživatel nenalezen' });
    const displayName = deriveDisplayName(user);
    const rawId = user._id.toString();
    const fallbackCreated = user.createdAt || new Date(parseInt(rawId.substring(0,8),16)*1000);
    res.json({
      id: rawId,
      email: user.email,
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      fullName: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
      displayName,
      birthDate: user.birthDate || null,
      gender: user.gender || '',
      location: user.location || '',
      avatarUrl: user.avatarUrl || '',
      phoneCountryCode: user.phoneCountryCode || '',
      phoneNumber: user.phoneNumber || '',
      role: user.role || 'user',
  finallyRegistered: !!user.finallyRegistered,
  createdAt: fallbackCreated || null,
  registeredAt: fallbackCreated || null
    });
  })
);

// Avatar upload
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const userAvatarDir = process.env.USERS_UPLOAD_DIR || path.join(process.cwd(), 'uploads', 'users');
if (!fs.existsSync(userAvatarDir)) fs.mkdirSync(userAvatarDir, { recursive: true });
const userAvatarUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 1_500_000 },
  fileFilter: (req, file, cb) => {
    if (!['image/png','image/jpeg','image/jpg','image/webp'].includes(file.mimetype)) {
      const err = new Error('unsupported-file-type'); err.code = 'UNSUPPORTED_TYPE'; return cb(err);
    }
    cb(null, true);
  }
});

router.post('/me/avatar', requireAuth, (req,res,next)=>{
  userAvatarUpload.single('avatar')(req,res,(err)=>{
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') return res.status(413).json({ error: 'Soubor je příliš velký. Max 1.5 MB.' });
      if (err.code === 'UNSUPPORTED_TYPE') return res.status(400).json({ error: 'Nepodporovaný formát. Povolené: JPG, PNG, WEBP.' });
      return res.status(400).json({ error: 'Upload selhal' });
    }
    next();
  });
}, asyncHandler(async (req,res)=>{
  if(!req.file) return res.status(400).json({ error:'Soubor chybí' });
  const ext = req.file.mimetype.split('/')[1] || 'png';
  const fileName = req.user.id + '_' + Date.now() + '.' + ext;
  await fs.promises.writeFile(path.join(userAvatarDir, fileName), req.file.buffer);
  const user = await User.findByIdAndUpdate(req.user.id, { avatarUrl: '/uploads/users/' + fileName }, { new:true });
  if(!user) return res.status(404).json({ error:'Uživatel nenalezen' });
  res.json({ avatarUrl: user.avatarUrl });
}));

// Delete avatar
router.delete('/me/avatar', requireAuth, asyncHandler(async (req,res)=>{
  const user = await User.findById(req.user.id);
  if(!user) return res.status(404).json({ error:'Uživatel nenalezen' });
  if (user.avatarUrl) {
    try {
      const fileName = path.basename(user.avatarUrl);
      const fullPath = path.join(userAvatarDir, fileName);
      if (fs.existsSync(fullPath)) {
        try { await fs.promises.unlink(fullPath); } catch(_) {/* ignore */}
      }
    } catch (e) {
      // log but don't fail deletion for user
      console.warn('AVATAR_DELETE_FAIL', e);
    }
    user.avatarUrl = '';
    await user.save();
  }
  res.json({ avatarUrl: '' });
}));

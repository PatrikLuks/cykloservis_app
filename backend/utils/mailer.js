const nodemailer = require('nodemailer');

let transporter = null;
if (process.env.NODE_ENV !== 'test') {
  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    tls: { rejectUnauthorized: false },
  });
}

async function sendMail({ to, subject, html }) {
  if (!transporter) {
    // test / fallback režim – emailem jen "předstíráme" doručení
    return true;
  }
  try {
    await transporter.sendMail({ to, subject, html });
    return true;
  } catch (err) {
    if (process.env.NODE_ENV !== 'test') {
      console.error('MAILER ERROR:', err);
    }
    return false;
  }
}

module.exports = { sendMail };

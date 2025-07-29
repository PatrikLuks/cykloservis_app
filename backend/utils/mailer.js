const nodemailer = require('nodemailer');

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

async function sendMail({ to, subject, html }) {
  try {
    await transporter.sendMail({ to, subject, html });
    return true;
  } catch (err) {
    console.error('MAILER ERROR:', err);
    return false;
  }
}

module.exports = { sendMail };

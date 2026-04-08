'use strict';

const logger = require('../../../../shared/utils/logger');

let nodemailer;
try { nodemailer = require('nodemailer'); } catch { nodemailer = null; }

let _transporter = null;

function getTransporter() {
  if (!nodemailer || !process.env.SMTP_HOST) return null;
  if (!_transporter) {
    _transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: parseInt(process.env.SMTP_PORT) === 465,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
  }
  return _transporter;
}

exports.sendEmail = async ({ to, subject, html }) => {
  const t = getTransporter();
  if (!t) { logger.info(`[Email] Would send to ${to}: "${subject}"`); return; }
  try {
    const info = await t.sendMail({
      from: `"Panchakarma Clinic" <${process.env.EMAIL_FROM || process.env.SMTP_USER}>`,
      to, subject, html,
    });
    logger.info(`[Email] Sent to ${to} — ${info.messageId}`);
  } catch (err) {
    logger.error(`[Email] Failed to ${to}:`, { error: err.message });
  }
};

exports.sendPasswordReset = async ({ to, token }) => {
  const url = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${token}`;
  return exports.sendEmail({
    to,
    subject: '🔑 Reset Your Panchakarma Password',
    html: `
      <h2>Password Reset Request</h2>
      <p>Click the link below to reset your password. This link expires in 1 hour.</p>
      <a href="${url}" style="display:inline-block;padding:12px 24px;background:#2D5016;color:white;border-radius:6px;text-decoration:none;font-weight:bold">Reset Password</a>
      <p style="color:#888;font-size:12px;margin-top:20px">If you didn't request this, ignore this email.</p>`,
  });
};

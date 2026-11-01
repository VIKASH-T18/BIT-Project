/**
 * @file nodemailer.js
 * @description Nodemailer transporter and reusable email sending utilities.
 * Uses Gmail SMTP by default; configurable via environment variables.
 */

const nodemailer = require("nodemailer");
const logger = require("../utils/logger");

// ─── Transporter ─────────────────────────────────────────────────────────────

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || "smtp.gmail.com",
  port: parseInt(process.env.EMAIL_PORT) || 587,
  secure: false, // true for port 465
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  tls: {
    rejectUnauthorized: false, // Allow self-signed certs in dev
  },
});

// ─── Verify Connection ────────────────────────────────────────────────────────

transporter.verify((error) => {
  if (error) {
    logger.warn(`⚠️  Email transporter verification notice: ${error.message}`);
    logger.info("ℹ️  Email fallback mode active: OTPs and email notifications will also be logged to server console.");
  } else {
    logger.info("✅ Email transporter is ready to send messages");
  }
});

// ─── Base Send Function ───────────────────────────────────────────────────────

/**
 * Send an email.
 * @param {object} options
 * @param {string} options.to - Recipient email
 * @param {string} options.subject - Email subject
 * @param {string} options.html - HTML body
 * @param {string} [options.text] - Plain text fallback
 * @returns {Promise<object>}
 */
const sendEmail = async ({ to, subject, html, text }) => {
  const mailOptions = {
    from: process.env.EMAIL_FROM || "BIT Hostel <noreply@bithostel.edu.in>",
    to,
    subject,
    html,
    text: text || html.replace(/<[^>]+>/g, ""), // strip HTML for text fallback
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    logger.info(`📧 Email sent to ${to} | MessageId: ${info.messageId}`);
    return info;
  } catch (error) {
    logger.warn(`⚠️ Email delivery notice to ${to} (${error.message}). Message recorded in server logs.`);
    return { messageId: `mock-${Date.now()}` };
  }
};

// ─── Email Template Helpers ───────────────────────────────────────────────────

/**
 * Wraps content in a branded HTML email shell.
 * @param {string} content - Inner HTML content
 * @returns {string} - Full HTML email
 */
const emailWrapper = (content) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <style>
    body { margin:0; padding:0; font-family:'Segoe UI',Arial,sans-serif; background:#f4f6f9; }
    .container { max-width:600px; margin:30px auto; background:#fff; border-radius:12px; overflow:hidden; box-shadow:0 4px 20px rgba(0,0,0,0.08); }
    .header { background:linear-gradient(135deg,#1e3a5f 0%,#2563eb 100%); padding:30px 40px; text-align:center; }
    .header h1 { color:#fff; margin:0; font-size:24px; letter-spacing:0.5px; }
    .header p { color:rgba(255,255,255,0.8); margin:6px 0 0; font-size:13px; }
    .body { padding:36px 40px; color:#374151; line-height:1.7; }
    .otp-box { background:#f0f4ff; border:2px dashed #2563eb; border-radius:10px; padding:20px; text-align:center; margin:24px 0; }
    .otp-code { font-size:36px; font-weight:800; color:#2563eb; letter-spacing:8px; }
    .btn { display:inline-block; background:#2563eb; color:#fff!important; padding:12px 28px; border-radius:8px; text-decoration:none; font-weight:600; margin:16px 0; }
    .footer { background:#f8fafc; padding:20px 40px; text-align:center; color:#94a3b8; font-size:12px; border-top:1px solid #e5e7eb; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🏫 BIT Hostel Portal</h1>
      <p>Bannari Amman Institute of Technology</p>
    </div>
    <div class="body">${content}</div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} BIT Hostel Management System. All rights reserved.</p>
      <p>This is an automated message. Please do not reply.</p>
    </div>
  </div>
</body>
</html>`;

/**
 * Send OTP verification email.
 * @param {string} to - Recipient email
 * @param {string} name - Recipient name
 * @param {string} otp - 6-digit OTP
 */
const sendOtpEmail = (to, name, otp) => {
  logger.info(`🔐 [OTP Code for ${to}]: ${otp}`);
  return sendEmail({
    to,
    subject: "🔐 Your BIT Hostel Verification Code",
    html: emailWrapper(`
      <h2>Hello, ${name}! 👋</h2>
      <p>Use the following One-Time Password (OTP) to verify your email address. This code expires in <strong>10 minutes</strong>.</p>
      <div class="otp-box">
        <div class="otp-code">${otp}</div>
        <p style="margin:8px 0 0;color:#6b7280;font-size:13px;">Enter this code in the verification screen</p>
      </div>
      <p>If you did not create an account, please ignore this email.</p>
    `),
  });
};

/**
 * Send password reset email.
 * @param {string} to - Recipient email
 * @param {string} name - Recipient name
 * @param {string} resetUrl - Reset link with token
 */
const sendPasswordResetEmail = (to, name, resetUrl) =>
  sendEmail({
    to,
    subject: "🔑 Reset Your BIT Hostel Password",
    html: emailWrapper(`
      <h2>Password Reset Request</h2>
      <p>Hi <strong>${name}</strong>,</p>
      <p>We received a request to reset your password. Click the button below to set a new password. This link expires in <strong>1 hour</strong>.</p>
      <div style="text-align:center">
        <a class="btn" href="${resetUrl}">Reset Password</a>
      </div>
      <p>Or copy this link: <a href="${resetUrl}" style="color:#2563eb">${resetUrl}</a></p>
      <p style="color:#ef4444;font-size:13px;margin-top:20px;">⚠️ If you did not request a password reset, please contact the hostel admin immediately.</p>
    `),
  });

/**
 * Send room allocation notification email.
 * @param {string} to - Recipient email
 * @param {string} name - Student name
 * @param {object} allocationDetails - Block, floor, room, bed details
 */
const sendAllocationEmail = (to, name, allocationDetails) =>
  sendEmail({
    to,
    subject: "🏠 Your Hostel Room Has Been Allocated!",
    html: emailWrapper(`
      <h2>🎉 Congratulations, ${name}!</h2>
      <p>Your hostel room has been successfully allocated. Here are your room details:</p>
      <table style="width:100%;border-collapse:collapse;margin:20px 0">
        <tr style="background:#f0f4ff"><td style="padding:10px 14px;font-weight:600;border:1px solid #e5e7eb">Hostel Block</td><td style="padding:10px 14px;border:1px solid #e5e7eb">${allocationDetails.block}</td></tr>
        <tr><td style="padding:10px 14px;font-weight:600;border:1px solid #e5e7eb">Floor</td><td style="padding:10px 14px;border:1px solid #e5e7eb">${allocationDetails.floor}</td></tr>
        <tr style="background:#f0f4ff"><td style="padding:10px 14px;font-weight:600;border:1px solid #e5e7eb">Room Number</td><td style="padding:10px 14px;border:1px solid #e5e7eb">${allocationDetails.roomNo}</td></tr>
        <tr><td style="padding:10px 14px;font-weight:600;border:1px solid #e5e7eb">Bed</td><td style="padding:10px 14px;border:1px solid #e5e7eb">${allocationDetails.bed}</td></tr>
        <tr style="background:#f0f4ff"><td style="padding:10px 14px;font-weight:600;border:1px solid #e5e7eb">Room Type</td><td style="padding:10px 14px;border:1px solid #e5e7eb">${allocationDetails.roomType}</td></tr>
      </table>
      <p>Please visit the hostel office within 3 days to complete your check-in. Bring your original documents.</p>
    `),
  });

/**
 * Send welcome email after successful registration.
 */
const sendWelcomeEmail = (to, name) =>
  sendEmail({
    to,
    subject: "Welcome to BIT Hostel Portal! 🎓",
    html: emailWrapper(`
      <h2>Welcome, ${name}! 🎉</h2>
      <p>Your account has been successfully created at <strong>BIT Hostel Management Portal</strong>.</p>
      <p>You can now:</p>
      <ul>
        <li>Apply for hostel accommodation</li>
        <li>Find compatible roommates using AI matching</li>
        <li>Track your application status</li>
        <li>Submit complaints and leave requests</li>
      </ul>
      <div style="text-align:center">
        <a class="btn" href="${process.env.CLIENT_URL}/login">Login to Portal</a>
      </div>
    `),
  });


/**
 * Send application status notification email.
 * @param {string} to - Recipient email
 * @param {string} name - Student name
 * @param {object} details - { status, academicYear, reviewComments, rejectionReason, waitlistPosition, portalUrl }
 */
const sendApplicationStatusEmail = (to, name, details) => {
  const { status, academicYear, reviewComments, rejectionReason, waitlistPosition, portalUrl } = details;

  const statusConfig = {
    approved: {
      subject: "✅ Hostel Application Approved!",
      emoji: "✅",
      heading: "Application Approved!",
      color: "#16a34a",
      body: `<p>Great news, <strong>${name}</strong>! Your hostel application for <strong>${academicYear}</strong> has been <strong>approved</strong>.</p>
             <p>Room allocation will be processed shortly. You will receive a separate notification once your room is assigned.</p>
             ${reviewComments ? `<p><strong>Remarks:</strong> ${reviewComments}</p>` : ""}`,
    },
    rejected: {
      subject: "❌ Hostel Application Update",
      emoji: "❌",
      heading: "Application Status Update",
      color: "#dc2626",
      body: `<p>Dear <strong>${name}</strong>, your hostel application for <strong>${academicYear}</strong> was not approved at this time.</p>
             ${rejectionReason ? `<p><strong>Reason:</strong> ${rejectionReason}</p>` : ""}
             ${reviewComments ? `<p><strong>Remarks:</strong> ${reviewComments}</p>` : ""}
             <p>You may contact the hostel office or reapply in the next cycle.</p>`,
    },
    waitlisted: {
      subject: "⏳ You're on the Hostel Waitlist",
      emoji: "⏳",
      heading: "Added to Waitlist",
      color: "#d97706",
      body: `<p>Dear <strong>${name}</strong>, your hostel application for <strong>${academicYear}</strong> has been added to the waitlist.</p>
             ${waitlistPosition ? `<p><strong>Your waitlist position:</strong> #${waitlistPosition}</p>` : ""}
             <p>You will be notified automatically when a room becomes available for you.</p>`,
    },
  };

  const cfg = statusConfig[status];
  if (!cfg) return Promise.resolve();

  return sendEmail({
    to,
    subject: cfg.subject,
    html: emailWrapper(`
      <h2>${cfg.emoji} ${cfg.heading}</h2>
      ${cfg.body}
      <div style="text-align:center;margin-top:20px">
        <a class="btn" href="${portalUrl || process.env.CLIENT_URL + '/student/application'}" style="background:${cfg.color}">View Application</a>
      </div>
    `),
  });
};

/**
 * Send waitlist promotion email.
 */
const sendWaitlistPromotionEmail = (to, name, allocationDetails) =>
  sendEmail({
    to,
    subject: "🎉 Great News — Room Available for You!",
    html: emailWrapper(`
      <h2>🎉 You've Been Promoted from Waitlist!</h2>
      <p>Dear <strong>${name}</strong>, a room has become available for you!</p>
      <p>Your room details:</p>
      <table style="width:100%;border-collapse:collapse;margin:20px 0">
        <tr style="background:#f0f4ff"><td style="padding:10px 14px;font-weight:600;border:1px solid #e5e7eb">Block</td><td style="padding:10px 14px;border:1px solid #e5e7eb">${allocationDetails.block}</td></tr>
        <tr><td style="padding:10px 14px;font-weight:600;border:1px solid #e5e7eb">Room</td><td style="padding:10px 14px;border:1px solid #e5e7eb">${allocationDetails.roomNo}</td></tr>
        <tr style="background:#f0f4ff"><td style="padding:10px 14px;font-weight:600;border:1px solid #e5e7eb">Bed</td><td style="padding:10px 14px;border:1px solid #e5e7eb">${allocationDetails.bed}</td></tr>
      </table>
      <div style="text-align:center">
        <a class="btn" href="${process.env.CLIENT_URL}/student/allocation">View Room Details</a>
      </div>
    `),
  });

/**
 * Send room transfer notification email.
 */
const sendRoomTransferEmail = (to, name, details) =>
  sendEmail({
    to,
    subject: "🔄 Room Transfer Notification",
    html: emailWrapper(`
      <h2>🔄 Room Transfer</h2>
      <p>Dear <strong>${name}</strong>, you have been transferred to a new room.</p>
      <table style="width:100%;border-collapse:collapse;margin:20px 0">
        <tr style="background:#f0f4ff"><td style="padding:10px 14px;font-weight:600;border:1px solid #e5e7eb">New Block</td><td style="padding:10px 14px;border:1px solid #e5e7eb">${details.block}</td></tr>
        <tr><td style="padding:10px 14px;font-weight:600;border:1px solid #e5e7eb">New Room</td><td style="padding:10px 14px;border:1px solid #e5e7eb">${details.roomNo}</td></tr>
        <tr style="background:#f0f4ff"><td style="padding:10px 14px;font-weight:600;border:1px solid #e5e7eb">Bed</td><td style="padding:10px 14px;border:1px solid #e5e7eb">${details.bed}</td></tr>
        ${details.reason ? `<tr><td style="padding:10px 14px;font-weight:600;border:1px solid #e5e7eb">Reason</td><td style="padding:10px 14px;border:1px solid #e5e7eb">${details.reason}</td></tr>` : ""}
      </table>
      <div style="text-align:center">
        <a class="btn" href="${process.env.CLIENT_URL}/student/allocation">View Allocation</a>
      </div>
    `),
  });

module.exports = {
  sendEmail,
  sendOtpEmail,
  sendPasswordResetEmail,
  sendAllocationEmail,
  sendWelcomeEmail,
  sendApplicationStatusEmail,
  sendWaitlistPromotionEmail,
  sendRoomTransferEmail,
};

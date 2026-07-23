const nodemailer = require("nodemailer");

/**
 * Email Service
 * Uses Nodemailer with SMTP (Gmail by default).
 * For production, swap with SendGrid / AWS SES by changing the transporter.
 */
const createTransporter = () => {
  return nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE || "gmail",
    host: process.env.EMAIL_HOST || "smtp.gmail.com",
    port: process.env.EMAIL_PORT || 587,
    secure: false, // TLS
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS, // Use App Password for Gmail (not your real password)
    },
  });
};

/**
 * Send a password reset email.
 * @param {string} toEmail - Recipient's email address
 * @param {string} userName - Recipient's name (for personalization)
 * @param {string} resetUrl - The full reset URL with token
 */
const sendPasswordResetEmail = async (toEmail, userName, resetUrl) => {
  const transporter = createTransporter();

  const mailOptions = {
    from: `"MediQueue" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: "Reset Your MediQueue Password",
    html: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Password Reset</title>
</head>
<body style="margin:0;padding:0;background:#0f1117;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f1117;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#1a1d27;border-radius:16px;border:1px solid #2a2d3e;overflow:hidden;">
          
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#3b82f6,#8b5cf6);padding:32px;text-align:center;">
              <div style="width:48px;height:48px;background:rgba(255,255,255,0.2);border-radius:12px;margin:0 auto 12px;display:flex;align-items:center;justify-content:center;">
                <span style="font-size:24px;">🏥</span>
              </div>
              <h1 style="color:#fff;margin:0;font-size:22px;font-weight:700;">MediQueue</h1>
              <p style="color:rgba(255,255,255,0.7);margin:4px 0 0;font-size:13px;">Healthcare Queue Management</p>
            </td>
          </tr>
          
          <!-- Body -->
          <tr>
            <td style="padding:36px 32px;">
              <h2 style="color:#f1f5f9;font-size:20px;font-weight:700;margin:0 0 8px;">Reset Your Password</h2>
              <p style="color:#94a3b8;font-size:15px;line-height:1.6;margin:0 0 24px;">
                Hi <strong style="color:#e2e8f0;">${userName}</strong>, we received a request to reset your password. Click the button below to create a new password.
              </p>
              
              <!-- CTA Button -->
              <div style="text-align:center;margin:28px 0;">
                <a href="${resetUrl}" style="display:inline-block;background:linear-gradient(135deg,#3b82f6,#8b5cf6);color:#fff;text-decoration:none;padding:14px 32px;border-radius:10px;font-weight:700;font-size:15px;letter-spacing:0.3px;">
                  Reset Password →
                </a>
              </div>
              
              <!-- Warning -->
              <div style="background:#1e2235;border:1px solid #2a2d3e;border-left:3px solid #f59e0b;border-radius:8px;padding:14px 16px;margin:24px 0;">
                <p style="color:#fbbf24;font-size:13px;font-weight:600;margin:0 0 4px;">⏱ This link expires in 15 minutes</p>
                <p style="color:#94a3b8;font-size:13px;margin:0;">If you did not request a password reset, you can safely ignore this email.</p>
              </div>
              
              <!-- Fallback URL -->
              <p style="color:#64748b;font-size:12px;line-height:1.6;margin:0;">
                If the button doesn't work, copy and paste this link into your browser:<br>
                <a href="${resetUrl}" style="color:#3b82f6;word-break:break-all;">${resetUrl}</a>
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background:#13161f;padding:20px 32px;border-top:1px solid #2a2d3e;text-align:center;">
              <p style="color:#475569;font-size:12px;margin:0;">© 2025 MediQueue. All rights reserved.</p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `,
  };

  await transporter.sendMail(mailOptions);
};

module.exports = { sendPasswordResetEmail };

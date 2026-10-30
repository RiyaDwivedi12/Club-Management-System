import nodemailer from 'nodemailer';

/**
 * Get active SMTP credentials dynamically
 */
const getCredentials = () => {
  const user = process.env.EMAIL_USER || 'offical.clubo2026@gmail.com';
  const pass = (process.env.EMAIL_PASS || 'aref imlo nnkg xqwb').trim();
  return { user, pass };
};

/**
 * Create fresh SMTP transporter with strict connection and socket timeouts.
 * Disabling persistent pooling avoids stale/dropped socket hangs on cloud hosting (Render).
 */
const createTransporter = () => {
  const { user, pass } = getCredentials();
  if (!user || !pass) {
    return null;
  }

  return nodemailer.createTransport({
    service: 'gmail',
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
      user,
      pass,
    },
    // Strict timeouts ensure the application never hangs if SMTP or network is slow
    connectionTimeout: 8000,
    greetingTimeout: 6000,
    socketTimeout: 10000,
    tls: {
      rejectUnauthorized: false,
    },
  });
};

/**
 * Generate a responsive, professional HTML email template
 */
const buildHtmlTemplate = ({ title, preheader, name, otp, messageText }) => {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title || 'CampusHub Verification'}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; padding: 32px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 520px; background-color: #ffffff; border-radius: 20px; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.01); border: 1px solid #e2e8f0; overflow: hidden;" cellspacing="0" cellpadding="0">
          <!-- Header Banner -->
          <tr>
            <td style="background: linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%); padding: 32px 24px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">CampusHub</h1>
              <p style="margin: 6px 0 0 0; color: #bfdbfe; font-size: 13px; font-weight: 500;">College Club Management System</p>
            </td>
          </tr>
          <!-- Body Content -->
          <tr>
            <td style="padding: 32px 28px;">
              ${name ? `<p style="margin: 0 0 16px 0; font-size: 15px; font-weight: 600; color: #0f172a;">Hello ${name},</p>` : ''}
              <p style="margin: 0 0 24px 0; font-size: 14px; line-height: 1.6; color: #475569;">
                ${messageText || 'Please use the verification code below to complete your authentication with CampusHub:'}
              </p>
              
              ${otp ? `
              <!-- OTP Box -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin: 24px 0;">
                <tr>
                  <td align="center" style="background-color: #f1f5f9; border-radius: 14px; border: 2px dashed #93c5fd; padding: 20px 16px;">
                    <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; color: #2563eb; margin-bottom: 8px;">Your One-Time Password</div>
                    <div style="font-family: 'Courier New', Courier, monospace; font-size: 34px; font-weight: 800; letter-spacing: 8px; color: #1e3a8a; text-indent: 8px;">${otp}</div>
                    <div style="font-size: 12px; color: #64748b; margin-top: 8px; font-weight: 500;">Valid for 15 minutes</div>
                  </td>
                </tr>
              </table>
              ` : ''}

              <div style="background-color: #f8fafc; border-left: 4px solid #3b82f6; padding: 12px 16px; border-radius: 6px; margin-top: 24px;">
                <p style="margin: 0; font-size: 12px; line-height: 1.5; color: #64748b;">
                  <strong>Security Note:</strong> Never share this code with anyone. CampusHub administrators will never ask for your verification code or password.
                </p>
              </div>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 20px 24px; text-align: center;">
              <p style="margin: 0; font-size: 12px; color: #94a3b8;">
                This is an automated security email from CampusHub. If you did not request this, you can safely ignore this message.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
};

/**
 * Send an email using Nodemailer
 * @param {Object} options - { email, subject, message, html, otp, userName }
 */
const sendEmail = async (options) => {
  const { user, pass } = getCredentials();

  if (!user || !pass) {
    console.log('[sendEmail] SMTP not configured. Logged message:');
    console.log(`To: ${options.email} | Subject: ${options.subject}`);
    return { success: true, mocked: true };
  }

  const transporter = createTransporter();
  if (!transporter) {
    throw new Error('Failed to initialize SMTP email transport');
  }

  // Extract OTP if provided explicitly or in message
  const otpMatch = options.otp || (options.message && options.message.match(/\b\d{6}\b/)?.[0]);

  const htmlContent = options.html || buildHtmlTemplate({
    title: options.subject,
    name: options.userName,
    otp: otpMatch,
    messageText: options.message,
  });

  const mailOptions = {
    from: `"CampusHub Official" <${user}>`,
    to: options.email,
    subject: options.subject,
    text: options.message,
    html: htmlContent,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`[sendEmail] Delivered successfully to ${options.email} (ID: ${info.messageId})`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`[sendEmail] Delivery failed for ${options.email}:`, error.message);
    throw error;
  }
};

export default sendEmail;

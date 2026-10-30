import nodemailer from 'nodemailer';

/**
 * Get Brevo / SMTP configuration dynamically from environment
 */
const getMailConfig = () => {
  const host = process.env.SMTP_HOST || 'smtp-relay.brevo.com';
  const port = Number(process.env.SMTP_PORT) || 587;
  const user = (process.env.BREVO_USER || process.env.SMTP_USER || 'c0befc001@smtp-brevo.com').trim();
  const pass = (process.env.BREVO_PASS || process.env.BREVO_API_KEY || process.env.SMTP_PASS || 'bskVpm1hbpAWEHC').trim();
  const senderEmail = (process.env.BREVO_SENDER || process.env.SENDER_EMAIL || process.env.EMAIL_USER || 'offical.clubo2026@gmail.com').trim();

  // Check if Brevo API key is available (starts with xkeysib- or xsmtpsib-)
  const apiKey = (process.env.BREVO_API_KEY || (pass.startsWith('xkeysib-') || pass.startsWith('xsmtpsib-') ? pass : '')).trim();

  return { host, port, user, pass, senderEmail, apiKey };
};

/**
 * Generate a responsive, professional HTML email template
 */
const buildHtmlTemplate = ({ title, name, otp, messageText }) => {
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
        <table role="presentation" width="100%" style="max-width: 520px; background-color: #ffffff; border-radius: 20px; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05); border: 1px solid #e2e8f0; overflow: hidden;" cellspacing="0" cellpadding="0">
          <tr>
            <td style="background: linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%); padding: 32px 24px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">CampusHub</h1>
              <p style="margin: 6px 0 0 0; color: #bfdbfe; font-size: 13px; font-weight: 500;">College Club Management System</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 32px 28px;">
              ${name ? `<p style="margin: 0 0 16px 0; font-size: 15px; font-weight: 600; color: #0f172a;">Hello ${name},</p>` : ''}
              <p style="margin: 0 0 24px 0; font-size: 14px; line-height: 1.6; color: #475569;">
                ${messageText || 'Please use the verification code below to complete your authentication with CampusHub:'}
              </p>
              
              ${otp ? `
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
                  <strong>Security Note:</strong> Never share this code with anyone. CampusHub administrators will never ask for your verification code.
                </p>
              </div>
            </td>
          </tr>
          <tr>
            <td style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 20px 24px; text-align: center;">
              <p style="margin: 0; font-size: 12px; color: #94a3b8;">
                This is an automated security email from CampusHub.
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
 * Send email via Brevo HTTPS REST API (Bypasses Render's port blocks 100% reliably via Port 443)
 */
const sendViaBrevoRestApi = async ({ apiKey, senderEmail, to, subject, htmlContent, textContent }) => {
  const url = 'https://api.brevo.com/v3/smtp/email';
  const payload = {
    sender: { name: 'CampusHub Official', email: senderEmail },
    to: [{ email: to }],
    subject,
    htmlContent,
    textContent
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'accept': 'application/json',
      'api-key': apiKey,
      'content-type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || `Brevo REST API error (${response.status})`);
  }

  console.log(`[sendEmail] Delivered via Brevo REST API to ${to} (ID: ${data.messageId || 'ok'})`);
  return { success: true, messageId: data.messageId, provider: 'brevo-rest' };
};

/**
 * Send email via Brevo SMTP (smtp-relay.brevo.com)
 */
const sendViaBrevoSmtp = async ({ host, port, user, pass, senderEmail, to, subject, htmlContent, textContent }) => {
  const transporter = nodemailer.createTransport({
    host: host || 'smtp-relay.brevo.com',
    port: port || 587,
    secure: port === 465, // true for 465, false for 587/2525
    auth: {
      user,
      pass
    },
    connectionTimeout: 8000,
    greetingTimeout: 6000,
    socketTimeout: 10000,
    tls: {
      rejectUnauthorized: false
    }
  });

  const mailOptions = {
    from: `"CampusHub Official" <${senderEmail}>`,
    to,
    subject,
    text: textContent,
    html: htmlContent
  };

  const info = await transporter.sendMail(mailOptions);
  console.log(`[sendEmail] Delivered via Brevo SMTP (${host}:${port}) to ${to} (ID: ${info.messageId})`);
  return { success: true, messageId: info.messageId, provider: 'brevo-smtp' };
};

/**
 * Main email dispatcher (Brevo REST API -> Brevo SMTP Relay -> Fallback)
 */
const sendEmail = async (options) => {
  const { host, port, user, pass, senderEmail, apiKey } = getMailConfig();

  // Extract OTP if provided explicitly or in message
  const otpMatch = options.otp || (options.message && options.message.match(/\b\d{6}\b/)?.[0]);
  const htmlContent = options.html || buildHtmlTemplate({
    title: options.subject,
    name: options.userName,
    otp: otpMatch,
    messageText: options.message
  });
  const textContent = options.message;

  // 1. If Brevo API key is detected, prioritize Brevo REST API over Port 443
  // (Port 443 HTTPS is NEVER blocked by Render Free Tier)
  if (apiKey) {
    try {
      return await sendViaBrevoRestApi({
        apiKey,
        senderEmail,
        to: options.email,
        subject: options.subject,
        htmlContent,
        textContent
      });
    } catch (apiErr) {
      console.warn('[sendEmail] Brevo REST API attempt note:', apiErr.message);
    }
  }

  // 2. Brevo SMTP Relay (smtp-relay.brevo.com)
  if (user && pass) {
    try {
      return await sendViaBrevoSmtp({
        host,
        port,
        user,
        pass,
        senderEmail,
        to: options.email,
        subject: options.subject,
        htmlContent,
        textContent
      });
    } catch (smtpErr) {
      console.error(`[sendEmail] Brevo SMTP delivery attempt for ${options.email}:`, smtpErr.message);

      // If port 587 was blocked by host, retry once on alternative Brevo port 2525
      if (port === 587) {
        try {
          console.log('[sendEmail] Retrying Brevo via alternative port 2525...');
          return await sendViaBrevoSmtp({
            host,
            port: 2525,
            user,
            pass,
            senderEmail,
            to: options.email,
            subject: options.subject,
            htmlContent,
            textContent
          });
        } catch (retryErr) {
          console.error('[sendEmail] Brevo Port 2525 retry failed:', retryErr.message);
          throw retryErr;
        }
      }
      throw smtpErr;
    }
  }

  console.log('[sendEmail] Mail credentials not set. Message logged:');
  console.log(`To: ${options.email} | Subject: ${options.subject}`);
  return { success: true, mocked: true };
};

export default sendEmail;

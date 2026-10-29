import nodemailer from 'nodemailer';

const emailUser = process.env.EMAIL_USER || 'offical.clubo2026@gmail.com';
const emailPass = process.env.EMAIL_PASS || 'aref imlo nnkg xqwb';

// Singleton pooled transporter ensures TLS connection reuse (reduces email latency from 8s to <1s)
let cachedTransporter = null;

const getTransporter = () => {
  if (!cachedTransporter && emailUser && emailPass) {
    cachedTransporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      pool: true,
      maxConnections: 5,
      maxMessages: 100,
      auth: {
        user: emailUser,
        pass: emailPass,
      },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 15000,
    });
  }
  return cachedTransporter;
};

const sendEmail = async (options) => {
  if (!emailUser || !emailPass) {
    console.log('Mock Email (configure EMAIL_USER/EMAIL_PASS for real emails):');
    console.log(`To: ${options.email}`);
    console.log(`Subject: ${options.subject}`);
    console.log(`Message: ${options.message}`);
    return;
  }

  try {
    const transporter = getTransporter();
    const mailOptions = {
      from: `"CampusHub Official" <${emailUser}>`,
      to: options.email,
      subject: options.subject,
      text: options.message,
      html: options.html || options.message.replace(/\n/g, '<br/>'),
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', info.messageId);
    return info;
  } catch (error) {
    console.error('Email send failed (non-fatal):', error.message);
  }
};

export default sendEmail;

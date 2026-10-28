import nodemailer from 'nodemailer';

const sendEmail = async (options) => {
  // If email not configured, just log and return silently
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.log('Mock Email (configure EMAIL_USER/EMAIL_PASS for real emails):');
    console.log(`To: ${options.email}`);
    console.log(`Subject: ${options.subject}`);
    console.log(`Message: ${options.message}`);
    return;
  }

  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: `CampusHub <${process.env.EMAIL_USER}>`,
      to: options.email,
      subject: options.subject,
      text: options.message,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent:', info.messageId);
  } catch (error) {
    // Log but do NOT re-throw — email failure should never crash registration/login
    console.error('Email send failed (non-fatal):', error.message);
  }
};

export default sendEmail;

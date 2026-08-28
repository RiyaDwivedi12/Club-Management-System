import nodemailer from 'nodemailer';

const sendEmail = async (options) => {
  try {
    // Note: To use Gmail, you need an App Password if 2FA is enabled.
    // Configure your .env file with EMAIL_USER and EMAIL_PASS
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER || 'mock_email@gmail.com',
        pass: process.env.EMAIL_PASS || 'mock_password_123',
      },
    });

    const mailOptions = {
      from: `Club Management System <${process.env.EMAIL_USER || 'noreply@clubmanagement.com'}>`,
      to: options.email,
      subject: options.subject,
      text: options.message,
    };

    // Only attempt to send if environment variables are configured to prevent crashes during dev
    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
       const info = await transporter.sendMail(mailOptions);
       console.log('Email sent: %s', info.messageId);
    } else {
       console.log('Mock Email Sent (configure EMAIL_USER/EMAIL_PASS to send real emails):');
       console.log(`To: ${options.email}`);
       console.log(`Subject: ${options.subject}`);
       console.log(`Message: ${options.message}`);
    }
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
};

export default sendEmail;

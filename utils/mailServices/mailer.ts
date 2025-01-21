import nodemailer from 'nodemailer';

export const sendEmail = async ({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}): Promise<void> => {
  const transporter = nodemailer.createTransport({
    service: 'Gmail', // Or use a different provider
    auth: {
      user: process.env.EMAIL_USER, // Your email
      pass: process.env.EMAIL_PASS, // Your email password or app password
    },
  });

  await transporter.sendMail({
    from: `"Support Team" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html,
  });
};

import nodemailer from "nodemailer";
import SMTPConnection from "nodemailer/lib/smtp-connection";

export const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_SERVER_HOST,
  port: process.env.EMAIL_SERVER_PORT,
  secure: false,
  auth: {
    user: process.env.EMAIL_SERVER_USER,
    pass: process.env.EMAIL_SERVER_PASSWORD,
  },
} as SMTPConnection.Options);

export const sendEmail = ({
  to,
  subject,
  html,
  text,
}: {
  to: string;
  subject: string;
  html: string;
  text: string;
}) => {
  return transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to: to,
    subject: subject,
    html: html,
    text: text,
  });
};

//   try {
//     const href = `${AppPropertise.SITE_URL}/api/verify/token?tokenid=${token}`;

//     await transporter.sendMail({
//       from: process.env.EMAIL_FROM,
//       to: to,
//       subject: "Resent Your Password",
//       html: `<p>Please reset your password using below Link</p></br>
//     <a href='${href}'>Verify</a>`,
//     });

//     return true;
//   } catch (error) {
//     return false;
//   }

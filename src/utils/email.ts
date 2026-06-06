import nodemailer, { type Transporter } from "nodemailer";
import dotenv from "dotenv";
import type { TEmailQueueJobData } from "../queue/email.queue.js";
dotenv.config();

let transporter: Transporter;
export type TEmailOptions = {
  from: string;
  to: string;
  subject: string;
  text: string;
  html?: string;
};

function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      pool: true,
      maxConnections: 5,
      debug: true,
      logger: true,
    });
  }
}

export async function sendEmail(options: TEmailOptions) {
  getTransporter();
  try {
    await transporter.sendMail(options);
  } catch (error) {
    console.error("Error sending email:", error);
  }
}

export async function sendAnnouncementMailToUser(options: TEmailQueueJobData) {
  const { username, email, courseName, message, instructor } = options;

  const emailOptions: TEmailOptions = {
    from: "LMS",
    to: email,
    subject: `New Announcement in ${courseName}`,
    text: message,
    html: `<p>Hi ${username},</p><p>${message}</p><p>Best regards, ${instructor}</p>`,
  };

  await sendEmail(emailOptions);
}

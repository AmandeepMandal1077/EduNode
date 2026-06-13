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

/**
 * @desc Initializes the email transporter if it is not already created.
 * @input None
 * @output None
 */
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

/**
 * @desc Sends an email using the configured transporter.
 * @input {TEmailOptions} options - The email configuration options (from, to, subject, etc.).
 * @output {Promise<void>} Resolves when the email sending process is complete.
 */
export async function sendEmail(options: TEmailOptions) {
  getTransporter();
  try {
    await transporter.sendMail(options);
  } catch (error) {
    console.error("Error sending email:", error);
  }
}

/**
 * @desc Sends an announcement email to a subscribed student.
 * @input {TEmailQueueJobData} options - The data for the announcement email (username, message, etc.).
 * @output {Promise<void>} Resolves when the announcement email is sent.
 */
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

export type TPasswordResetEmailData = {
  username: string;
  email: string;
  resetUrl: string;
};

/**
 * @desc Sends a password reset email to a user with a unique reset link.
 * @input {TPasswordResetEmailData} options - The user data and reset URL.
 * @output {Promise<void>} Resolves when the password reset email is sent.
 */
export async function sendPasswordResetEmail(options: TPasswordResetEmailData) {
  const { username, email, resetUrl } = options;

  const emailOptions: TEmailOptions = {
    from: "EduNode <no-reply@edunode.com>",
    to: email,
    subject: "Reset your EduNode password",
    text: `Hi ${username},\n\nYou requested a password reset. Click the link below to set a new password:\n\n${resetUrl}\n\nThis link expires in 10 minutes. If you did not request this, please ignore this email.\n\nBest,\nThe EduNode Team`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;background:#f8fafc;border-radius:12px">
        <div style="text-align:center;margin-bottom:24px">
          <span style="font-size:22px;font-weight:800;color:#1e293b">Edu<span style="color:#4f46e5">Node</span></span>
        </div>
        <div style="background:#fff;border-radius:10px;padding:28px;box-shadow:0 1px 4px rgba(0,0,0,0.06)">
          <h2 style="margin:0 0 8px;font-size:18px;color:#1e293b">Reset your password</h2>
          <p style="margin:0 0 20px;color:#64748b;font-size:14px">Hi <strong>${username}</strong>, we received a request to reset your EduNode password. Click the button below — the link expires in <strong>10 minutes</strong>.</p>
          <a href="${resetUrl}" style="display:inline-block;padding:12px 28px;background:#4f46e5;color:#fff;text-decoration:none;border-radius:8px;font-weight:600;font-size:14px">Reset Password</a>
          <p style="margin:20px 0 0;font-size:12px;color:#94a3b8">If you didn't request this, you can safely ignore this email. Your password won't change.</p>
        </div>
        <p style="text-align:center;margin-top:20px;font-size:11px;color:#94a3b8">© EduNode. All rights reserved.</p>
      </div>
    `,
  };

  await sendEmail(emailOptions);
}

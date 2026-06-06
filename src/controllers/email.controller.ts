import type { Request, Response } from "express";
import { asyncHandler } from "../utils/asynchandler.js";
import { sendAnnouncementMailToUser } from "../utils/email.js";

export const sendEmailController = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      await sendAnnouncementMailToUser(req.body);
      res.status(200).json({
        success: true,
        message: "Email sent successfully",
      });
    } catch (error) {
      console.error("Error sending email:", error);
      res.status(500).json({
        success: false,
        message: "Failed to send email",
      });
    }
  },
);

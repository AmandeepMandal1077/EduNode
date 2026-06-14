import type { Request, Response } from "express";
import { asyncHandler } from "../utils/asynchandler.js";
import { sendAnnouncementMailToUser } from "../utils/email.js";

/**
 * @desc Sends an announcement email to a user.
 * @input {Request} req - The Express request object containing email options in the body.
 * @input {Response} res - The Express response object.
 * @output {Promise<void>} Sends a JSON response indicating success or failure.
 */
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

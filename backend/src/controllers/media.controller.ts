import type { Request, Response } from "express";
import type { AuthenticatedRequest } from "../types/user.js";
import { asyncHandler } from "../utils/asynchandler.js";
import {
  deleteMediaAuto,
  generateUploadSignature,
  verifyUploadSignature,
  type SignatureParams,
  type VerifyUploadParams,
} from "../utils/cloudinary.js";
import { ApiError } from "../utils/apiError.js";
import crypto from "crypto";
import { v2 as cloudinary } from "cloudinary";
import express from "express";

/**
 * @desc Generates an upload signature for frontend Cloudinary uploads.
 * @input {AuthenticatedRequest} req - The Express request object.
 * @input {Response} res - The Express response object.
 * @output {Promise<void>} Sends a JSON response with the signature data.
 */
export const generateSignature = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const params: SignatureParams = {
      folder: `LMS/${req.userId}`,
      resourceType: "auto",
    };

    const signatureData = generateUploadSignature(params);

    res.status(200).json({
      success: true,
      message: "Signature generated successfully",
      data: signatureData,
    });
  },
);

/**
 * @desc Verifies a Cloudinary upload signature from the frontend.
 * @input {AuthenticatedRequest} req - The Express request object containing upload details.
 * @input {Response} res - The Express response object.
 * @output {Promise<void>} Sends a JSON response confirming verification.
 */
export const verifySignature = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const { publicId, version, signature, secureUrl } = req.body;

    if (!publicId || !version || !signature) {
      throw new ApiError("publicId, version, and signature are required", 400);
    }

    const params: VerifyUploadParams = {
      publicId,
      version: Number(version),
      signature,
    };

    const isValid = verifyUploadSignature(params);

    if (!isValid) {
      await deleteMediaAuto(publicId);
      throw new ApiError("Invalid signature - upload verification failed", 400);
    }

    res.status(200).json({
      success: true,
      message: "Upload verified successfully",
      data: { verified: true, secureUrl, publicId },
    });
  },
);

/**
 * @desc Handles Cloudinary webhook events to verify uploads.
 * @input {Request} req - The Express request object containing headers and body.
 * @input {Response} res - The Express response object.
 * @output {Promise<void>} Sends a 200 response to acknowledge receipt.
 */
export const handleCloudinaryWebhook = asyncHandler(
  async (req: Request, res: Response) => {
    const signature = req.headers["x-cld-signature"] as string;
    const timestamp = req.headers["x-cld-timestamp"] as string;

    if (!signature || !timestamp) {
      console.error("Invalid webhook payload - missing signature");
      return res.status(200).json({ received: true });
    }
    const isValid = cloudinary.utils.verifyNotificationSignature(
      req.body,
      Number(timestamp),
      signature,
    );
    if (!isValid) {
      return res.status(200).json({ received: true });
    }

    const notification = JSON.parse(req.body.toString());
    const { public_id, version, secure_url, resource_type } = notification;
    if (!public_id || !version) {
      console.error("Invalid webhook payload - missing required fields");
      return res.status(200).json({ received: true });
    }


    res.status(200).json({ received: true });
  },
);

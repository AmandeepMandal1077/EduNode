import { v2 as cloudinary, type UploadApiResponse } from "cloudinary";
import { ApiError } from "./apiError.js";
import fs from "fs";
import path from "path";

// Configure cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME as string,
  api_key: process.env.CLOUDINARY_API_KEY as string,
  api_secret: process.env.CLOUDINARY_API_SECRET as string,
});

export interface SignatureParams {
  folder?: string;
  resourceType?: "image" | "video" | "raw" | "auto";
}

export interface SignatureResponse {
  signature: string;
  timestamp: number;
  cloudName: string;
  apiKey: string;
  folder: string;
  notificationUrl: string;
}

/**
 * Generates a signed upload signature for frontend uploads.
 * Includes notification_url so Cloudinary will webhook your server on upload complete.
 */
const generateUploadSignature = (
  params: SignatureParams = {},
): SignatureResponse => {
  const timestamp = Math.round(new Date().getTime() / 1000);
  const folder = params.folder || "LMS";
  const apiSecret = process.env.CLOUDINARY_API_SECRET as string;

  // Cloudinary webhook URL - receives POST when upload completes
  const notificationUrl = `${process.env.BACKEND_URL}/api/v1/media/webhook`;

  // Cloudinary Upload Widget automatically appends source: "uw" to signed uploads.
  // We must sign timestamp, folder, and source: "uw" to match the widget's signature format.
  const paramsToSign: Record<string, any> = {
    timestamp,
    folder,
    source: "uw",
  };

  const signature = cloudinary.utils.api_sign_request(paramsToSign, apiSecret);

  return {
    signature,
    timestamp,
    cloudName: process.env.CLOUDINARY_CLOUD_NAME as string,
    apiKey: process.env.CLOUDINARY_API_KEY as string,
    folder,
    notificationUrl,
  };
};

export interface VerifyUploadParams {
  publicId: string;
  version: number;
  signature: string;
}

/**
 * Verifies that an upload was successful by checking the signature
 * Cloudinary sends back: signature = SHA1(public_id + version + api_secret)
 */
const verifyUploadSignature = (params: VerifyUploadParams): boolean => {
  const { publicId, version, signature } = params;
  const apiSecret = process.env.CLOUDINARY_API_SECRET as string;

  // Cloudinary's verification signature format
  const expectedSignature = cloudinary.utils.api_sign_request(
    { public_id: publicId, version: version.toString() },
    apiSecret,
  );

  return expectedSignature === signature;
};

const deleteMedia = async (
  publicId: string,
  type: "image" | "video",
): Promise<any> => {
  try {
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: type,
    });
    return result;
  } catch (error) {
    console.error("ERROR: ", error);
    throw new ApiError("Failed to delete media", 500);
  }
};

/**
 * Delete media without knowing the resource type.
 * Tries image, video, and raw types in order.
 */
const deleteMediaAuto = async (publicId: string): Promise<any> => {
  const types: ("image" | "video" | "raw")[] = ["image", "video", "raw"];

  for (const type of types) {
    try {
      const result = await cloudinary.uploader.destroy(publicId, {
        resource_type: type,
        invalidate: true,
      });
      if (result.result === "ok") {
        console.log(`Deleted ${type}: ${publicId}`);
        return result;
      }
    } catch {
      // Try next type
    }
  }

  throw new ApiError("Failed to delete media - resource not found", 404);
};

export {
  generateUploadSignature,
  verifyUploadSignature,
  deleteMedia,
  deleteMediaAuto,
};

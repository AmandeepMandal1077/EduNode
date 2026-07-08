import { v2 as cloudinary } from "cloudinary";
import { ApiError } from "./apiError.js";

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
 * @desc Generates a signed upload signature for frontend uploads.
 * @input {SignatureParams} params - The optional configuration parameters for the signature.
 * @output {SignatureResponse} The generated signature and associated details.
 */
const generateUploadSignature = (
  params: SignatureParams = {},
): SignatureResponse => {
  const timestamp = Math.round(new Date().getTime() / 1000);
  const folder = params.folder || "LMS";
  const apiSecret = process.env.CLOUDINARY_API_SECRET as string;

  const notificationUrl = `${process.env.BACKEND_URL}/api/v1/media/webhook`;

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
 * @desc Verifies that an upload was successful by checking the signature.
 * @input {VerifyUploadParams} params - The parameters containing the publicId, version, and signature to verify.
 * @output {boolean} True if the signature is valid, false otherwise.
 */
const verifyUploadSignature = (params: VerifyUploadParams): boolean => {
  const { publicId, version, signature } = params;
  const apiSecret = process.env.CLOUDINARY_API_SECRET as string;

  const expectedSignature = cloudinary.utils.api_sign_request(
    { public_id: publicId, version: version.toString() },
    apiSecret,
  );

  return expectedSignature === signature;
};

/**
 * @desc Deletes media without knowing the resource type by trying image, video, and raw types.
 * @input {string} publicId - The public ID of the media to delete.
 * @output {Promise<any>} The result of the deletion from Cloudinary.
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
        return result;
      }
    } catch {
    }
  }

  throw new ApiError("Failed to delete media - resource not found", 404);
};

export {
  generateUploadSignature,
  verifyUploadSignature,
  deleteMediaAuto,
};

import apiClient from "./client";

export interface SignatureResponse {
  signature: string;
  timestamp: number;
  cloudName: string;
  apiKey: string;
  folder: string;
  notificationUrl: string;
}

/**
 * Fetch signed upload signature from backend for uploading to Cloudinary
 */
export async function fetchUploadSignature(): Promise<SignatureResponse> {
  const res = await apiClient.post("/media/signature");
  return res.data.data;
}

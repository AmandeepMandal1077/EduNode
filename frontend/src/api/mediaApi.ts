import apiClient from "./client";

export interface UploadSessionRequest {
  type: "avatar" | "course-image" | "lecture-video";
  entityId: string;
  fileName: string;
  contentType: string;
}

export interface UploadSessionResponse {
  uploadSessionId: string;
  s3Key: string;
  presignedUrl: string;
  expiresAt: string;
}

export interface UploadStatusResponse {
  status: "PENDING_UPLOAD" | "UPLOADED" | "PROCESSING" | "READY" | "FAILED" | "EXPIRED";
  videoUrl?: string;
  finalUrl?: string;
}

export const requestUploadSession = async (
  data: UploadSessionRequest
): Promise<UploadSessionResponse> => {
  const response = await apiClient.post("/media/upload-session", data);
  return response.data.data;
};

export const pollUploadStatus = async (
  uploadSessionId: string
): Promise<UploadStatusResponse> => {
  const response = await apiClient.get(`/media/status/${uploadSessionId}`);
  return response.data.data;
};

import axios from "axios";
import { requestUploadSession, pollUploadStatus, type UploadSessionRequest } from "../api/mediaApi";

export const uploadFileToS3 = async (
  presignedUrl: string,
  file: File,
  onProgress?: (percent: number) => void
): Promise<void> => {
  await axios.put(presignedUrl, file, {
    headers: {
      "Content-Type": file.type,
    },
    onUploadProgress: (progressEvent) => {
      if (onProgress) {
        const total = progressEvent.total ?? file.size;
        if (total > 0) {
          const percent = Math.round((progressEvent.loaded / total) * 100);
          onProgress(percent);
        }
      }
    },
  });
};

export const requestAndUpload = async (
  type: UploadSessionRequest["type"],
  entityId: string,
  file: File,
  onProgress?: (percent: number) => void
): Promise<{ uploadSessionId: string, s3Key: string }> => {
  const session = await requestUploadSession({
    type,
    entityId,
    fileName: file.name,
    contentType: file.type,
  });

  await uploadFileToS3(session.presignedUrl, file, onProgress);
  return { uploadSessionId: session.uploadSessionId, s3Key: session.s3Key };
};

export const waitForUploadReady = async (
  uploadSessionId: string,
  maxWaitMs: number = 30000,
  intervalMs: number = 2000
) => {
  const startTime = Date.now();
  
  while (Date.now() - startTime < maxWaitMs) {
    const statusObj = await pollUploadStatus(uploadSessionId);
    if (["UPLOADED", "READY", "FAILED", "EXPIRED"].includes(statusObj.status)) {
      return statusObj;
    }
    await new Promise(resolve => setTimeout(resolve, intervalMs));
  }
  
  throw new Error("Timeout waiting for upload confirmation");
};

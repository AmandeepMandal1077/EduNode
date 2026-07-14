import { requestUploadSession, pollUploadStatus, type UploadSessionRequest } from "../api/mediaApi";

export const uploadFileToS3 = (
  presignedUrl: string,
  file: File,
  onProgress?: (percent: number) => void
): Promise<void> => {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", presignedUrl, true);
    xhr.setRequestHeader("Content-Type", file.type);

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && onProgress) {
        const percent = Math.round((event.loaded / event.total) * 100);
        onProgress(percent);
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
      } else {
        reject(new Error(`Upload failed with status ${xhr.status}`));
      }
    };

    xhr.onerror = () => {
      reject(new Error("Network error occurred during upload"));
    };

    xhr.send(file);
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

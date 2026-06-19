import { fetchUploadSignature } from "../api/mediaApi";

export interface UploadResult {
  secureUrl: string;
  publicId: string;
  signature: string;
  version: number;
}

/**
 * @desc Opens the Cloudinary Upload Widget.
 * @input {string} [resourceType="image"] - The type of resource to upload ("image" or "video").
 * @output {Promise<UploadResult>} Resolves with the secure URL and public_id on success.
 */
export async function openCloudinaryWidget(
  resourceType: "image" | "video" = "image"
): Promise<UploadResult> {

  const signatureData = await fetchUploadSignature();

  return new Promise((resolve, reject) => {
    const cloudinary = (window as any).cloudinary;
    if (!cloudinary) {
      reject(new Error("Cloudinary SDK not loaded. Make sure the script is included in index.html."));
      return;
    }

    const widget = cloudinary.createUploadWidget(
      {
        cloudName: signatureData.cloudName,
        apiKey: signatureData.apiKey,
        uploadSignature: signatureData.signature,
        uploadSignatureTimestamp: signatureData.timestamp,
        folder: signatureData.folder,
        resourceType: resourceType,
        multiple: false,
        maxFiles: 1,
        theme: "minimal",
        styles: {
          palette: {
            window: "#FFFFFF",
            windowBorder: "#E2E8F0",
            tabIcon: "#4F46E5",
            menuIcons: "#4F46E5",
            textDark: "#0F172A",
            textLight: "#FFFFFF",
            link: "#4F46E5",
            action: "#4F46E5",
            inactiveTabIcon: "#64748B",
            error: "#EF4444",
            inProgress: "#4F46E5",
            complete: "#10B981",
            sourceBg: "#F8FAFC"
          }
        }
      },
      (error: any, result: any) => {
        if (error) {
          reject(error);
        } else if (result && result.event === "success") {
          resolve({
            secureUrl: result.info.secure_url,
            publicId: result.info.public_id,
            signature: result.info.signature,
            version: result.info.version,
          });
        }
      }
    );

    widget.open();
  });
}

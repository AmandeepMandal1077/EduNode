import { S3Client, DeleteObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { ApiError } from "./apiError.js";

let s3Client: S3Client | null = null;

export const getS3Client = (): S3Client => {
  if (!s3Client) {
    if (!process.env.AWS_REGION || !process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
      throw new Error("AWS credentials or region are not set in environment variables");
    }
    const s3Config: ConstructorParameters<typeof S3Client>[0] & { endpoint?: string; forcePathStyle?: boolean } = {
      region: process.env.AWS_REGION,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      },
    };

    if (process.env.AWS_ENDPOINT_URL) {
      s3Config.endpoint = process.env.AWS_ENDPOINT_URL;
      s3Config.forcePathStyle = true;
    }

    s3Client = new S3Client(s3Config);
  }
  return s3Client;
};

export const getBucketName = (): string => {
  const bucketName = process.env.S3_BUCKET_NAME || process.env.S3_BUCKET;
  if (!bucketName) {
    throw new Error("S3_BUCKET_NAME is not set in environment variables");
  }
  return bucketName;
};

export const getPublicBaseUrl = (): string => {
  return process.env.S3_PUBLIC_BASE_URL || `https://${getBucketName()}.s3.${process.env.AWS_REGION}.amazonaws.com/`;
};

export const generatePresignedPutUrl = async (
  key: string,
  contentType: string,
  expiresInSeconds: number = 900 // 15 minutes
): Promise<string> => {
  try {
    const client = getS3Client();
    const command = new PutObjectCommand({
      Bucket: getBucketName(),
      Key: key,
      ContentType: contentType,
    });

    let presignedUrl = await getSignedUrl(client, command, { expiresIn: expiresInSeconds });
    
    // Convert internal docker hostname to localhost for browser access
    if (process.env.AWS_ENDPOINT_URL && process.env.AWS_ENDPOINT_URL.includes("localstack")) {
      presignedUrl = presignedUrl.replace("localstack", "localhost");
    }
    
    return presignedUrl;
  } catch (error: any) {
    console.error("Error generating presigned URL:", error);
    throw new ApiError("Failed to generate presigned URL", 500);
  }
};

export const deleteS3Object = async (key: string): Promise<void> => {
  try {
    const client = getS3Client();
    const command = new DeleteObjectCommand({
      Bucket: getBucketName(),
      Key: key,
    });
    await client.send(command);
  } catch (error: any) {
    console.error(`Error deleting object with key ${key}:`, error);
  }
};

export const getPublicUrl = (key: string): string => {
  const baseUrl = getPublicBaseUrl();
  const normalizedBaseUrl = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
  return `${normalizedBaseUrl}${key}`;
};

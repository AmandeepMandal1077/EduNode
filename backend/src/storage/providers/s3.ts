import {
  DeleteObjectCommand,
  DeleteObjectsCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { ApiError } from "../../utils/apiError.js";
import debug from "../../utils/debug.js";
import {
  getStorageContainer,
  getStorageRegion,
  normalizeBaseUrl,
} from "../config.js";
import type { Storage, UploadTarget } from "../types.js";

export interface S3StorageOptions {
  endpoint?: string | undefined;
  /** Separate endpoint for signed URLs when the browser cannot resolve `endpoint`. */
  presignEndpoint?: string | undefined;
  forcePathStyle?: boolean | undefined;
  credentials?:
    | { accessKeyId: string; secretAccessKey: string }
    | undefined;
  publicBaseUrl?: string | undefined;
}

/**
 * Shared S3-compatible implementation used by the AWS and LocalStack
 * providers. The only difference between them is transport configuration.
 */
export const createS3Storage = (
  options: S3StorageOptions = {},
): Storage => {
  let client: S3Client | null = null;
  let presignClient: S3Client | null = null;

  const createClient = (endpoint: string | undefined): S3Client => {
    const credentials = options.credentials;
    if (!credentials) {
      throw new Error(
        "Storage credentials are not set (STORAGE_ACCESS_KEY / STORAGE_SECRET_KEY)",
      );
    }

    return new S3Client({
      region: getStorageRegion(),
      credentials,
      ...(endpoint
        ? {
            endpoint,
            forcePathStyle: options.forcePathStyle ?? true,
          }
        : {}),
    });
  };

  const getClient = (): S3Client => {
    if (!client) client = createClient(options.endpoint);
    return client;
  };

  const getPresignClient = (): S3Client => {
    if (!options.presignEndpoint) return getClient();
    if (!presignClient) {
      presignClient = createClient(options.presignEndpoint);
    }
    return presignClient;
  };

  const getPublicUrl = (key: string): string => {
    const container = getStorageContainer();
    const baseUrl =
      options.publicBaseUrl ||
      `https://${container}.s3.${getStorageRegion()}.amazonaws.com`;
    return `${normalizeBaseUrl(baseUrl)}/${key}`;
  };

  return {
    provider: options.endpoint ? "localstack" : "aws",

    async createUploadTarget(
      key: string,
      contentType: string,
      expiresInSeconds = 900,
    ): Promise<UploadTarget> {
      try {
        const command = new PutObjectCommand({
          Bucket: getStorageContainer(),
          Key: key,
          ContentType: contentType,
        });
        const url = await getSignedUrl(getPresignClient(), command, {
          expiresIn: expiresInSeconds,
        });
        return { url, method: "PUT", headers: {} };
      } catch (error: any) {
        debug("Error generating upload target:", error);
        throw new ApiError("Failed to generate upload URL", 500);
      }
    },

    async uploadObject(
      key: string,
      body: Buffer,
      contentType: string,
    ): Promise<void> {
      try {
        await getClient().send(
          new PutObjectCommand({
            Bucket: getStorageContainer(),
            Key: key,
            Body: body,
            ContentType: contentType,
          }),
        );
      } catch (error: any) {
        debug(`Error uploading object with key ${key}:`, error);
        throw new ApiError("Failed to upload object", 500);
      }
    },

    getPublicUrl,

    async deleteObject(key: string): Promise<void> {
      try {
        await getClient().send(
          new DeleteObjectCommand({
            Bucket: getStorageContainer(),
            Key: key,
          }),
        );
      } catch (error: any) {
        debug(`Error deleting object with key ${key}:`, error);
      }
    },

    async emptyContainer(): Promise<void> {
      const bucket = getStorageContainer();
      let listed = await getClient().send(
        new ListObjectsV2Command({ Bucket: bucket }),
      );

      while (listed.Contents && listed.Contents.length > 0) {
        await getClient().send(
          new DeleteObjectsCommand({
            Bucket: bucket,
            Delete: {
              Objects: listed.Contents.map((item) => ({ Key: item.Key! })),
            },
          }),
        );
        listed = await getClient().send(
          new ListObjectsV2Command({ Bucket: bucket }),
        );
      }
    },
  };
};

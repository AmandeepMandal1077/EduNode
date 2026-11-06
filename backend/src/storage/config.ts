import type { StorageProvider } from "./types.js";
import { STORAGE_PROVIDERS } from "./types.js";

/**
 * Resolves storage configuration from the environment.
 *
 * Primary variables are service-based (STORAGE_*). Legacy AWS names are
 * still accepted so existing deployments keep working without edits.
 */
export const getStorageProvider = (): StorageProvider => {
  const raw = (process.env.STORAGE_PROVIDER || "aws").trim().toLowerCase();
  if (!STORAGE_PROVIDERS.includes(raw as StorageProvider)) {
    throw new Error(
      `Invalid STORAGE_PROVIDER "${raw}". Expected one of: ${STORAGE_PROVIDERS.join(", ")}`,
    );
  }
  return raw as StorageProvider;
};

export const getStorageContainer = (): string => {
  const container =
    process.env.STORAGE_CONTAINER ||
    process.env.S3_BUCKET_NAME ||
    process.env.S3_BUCKET;
  if (!container) {
    throw new Error(
      "STORAGE_CONTAINER is not set in environment variables (legacy S3_BUCKET_NAME is also accepted)",
    );
  }
  return container;
};

export const getStorageRegion = (): string =>
  process.env.STORAGE_REGION || process.env.AWS_REGION || "us-east-1";

export const getStorageEndpoint = (): string | undefined =>
  process.env.STORAGE_ENDPOINT || undefined;

/** Endpoint used only for browser-facing presigned URLs (LocalStack: localhost). */
export const getStoragePresignEndpoint = (): string | undefined =>
  process.env.STORAGE_PRESIGN_ENDPOINT || undefined;

export const getStoragePublicBaseUrl = (): string | undefined =>
  process.env.STORAGE_PUBLIC_BASE_URL || undefined;

export const getStorageCredentials = ():
  | { accessKeyId: string; secretAccessKey: string }
  | undefined => {
  const accessKeyId =
    process.env.STORAGE_ACCESS_KEY || process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey =
    process.env.STORAGE_SECRET_KEY || process.env.AWS_SECRET_ACCESS_KEY;
  if (!accessKeyId || !secretAccessKey) return undefined;
  return { accessKeyId, secretAccessKey };
};

/** Connection string used by the Azure provider. */
export const getStorageConnectionString = (): string | undefined =>
  process.env.STORAGE_CONNECTION_STRING ||
  process.env.AZURE_STORAGE_CONNECTION_STRING;

export const getStorageAccountName = (): string | undefined =>
  process.env.STORAGE_ACCOUNT_NAME || process.env.AZURE_STORAGE_ACCOUNT_NAME;

export const getStorageAccountKey = (): string | undefined =>
  process.env.STORAGE_ACCOUNT_KEY || process.env.AZURE_STORAGE_ACCOUNT_KEY;

export const normalizeBaseUrl = (value: string): string =>
  value.endsWith("/") ? value.slice(0, -1) : value;

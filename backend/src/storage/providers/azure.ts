import {
  BlobSASPermissions,
  BlobServiceClient,
  StorageSharedKeyCredential,
} from "@azure/storage-blob";
import { ApiError } from "../../utils/apiError.js";
import debug from "../../utils/debug.js";
import {
  getStorageAccountKey,
  getStorageAccountName,
  getStorageConnectionString,
  getStorageContainer,
  getStoragePublicBaseUrl,
  normalizeBaseUrl,
} from "../config.js";
import type { Storage, UploadTarget } from "../types.js";

const createClient = (): BlobServiceClient => {
  const connectionString = getStorageConnectionString();
  if (connectionString) {
    return BlobServiceClient.fromConnectionString(connectionString);
  }

  const accountName = getStorageAccountName();
  const accountKey = getStorageAccountKey();
  if (!accountName || !accountKey) {
    throw new Error(
      "Azure storage requires STORAGE_CONNECTION_STRING or STORAGE_ACCOUNT_NAME / STORAGE_ACCOUNT_KEY",
    );
  }

  return new BlobServiceClient(
    `https://${accountName}.blob.core.windows.net`,
    new StorageSharedKeyCredential(accountName, accountKey),
  );
};

export const createAzureStorage = (): Storage => {
  let client: BlobServiceClient | null = null;

  const getClient = (): BlobServiceClient => {
    if (!client) client = createClient();
    return client;
  };

  const getContainer = () => getClient().getContainerClient(getStorageContainer());

  return {
    provider: "azure",

    async createUploadTarget(
      key: string,
      contentType: string,
      expiresInSeconds = 900,
    ): Promise<UploadTarget> {
      try {
        const blobClient = getContainer().getBlobClient(key);
        const url = await blobClient.generateSasUrl({
          permissions: BlobSASPermissions.parse("cw"),
          expiresOn: new Date(Date.now() + expiresInSeconds * 1000),
          contentType,
        });
        return {
          url,
          method: "PUT",
          headers: { "x-ms-blob-type": "BlockBlob" },
        };
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
        await getContainer().getBlockBlobClient(key).uploadData(body, {
          blobHTTPHeaders: { blobContentType: contentType },
        });
      } catch (error: any) {
        debug(`Error uploading object with key ${key}:`, error);
        throw new ApiError("Failed to upload object", 500);
      }
    },

    getPublicUrl(key: string): string {
      const baseUrl =
        getStoragePublicBaseUrl() ||
        `https://${getClient().accountName}.blob.core.windows.net/${getStorageContainer()}`;
      return `${normalizeBaseUrl(baseUrl)}/${key}`;
    },

    async deleteObject(key: string): Promise<void> {
      try {
        await getContainer().getBlobClient(key).deleteIfExists();
      } catch (error: any) {
        debug(`Error deleting object with key ${key}:`, error);
      }
    },

    async emptyContainer(): Promise<void> {
      const container = getContainer();
      for await (const blob of container.listBlobsFlat()) {
        await container.deleteBlob(blob.name, { deleteSnapshots: "include" });
      }
    },
  };
};

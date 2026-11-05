/**
 * Provider-neutral object storage contract.
 *
 * A provider implementation must only deal with transport details
 * (signing, endpoints, SDK clients). Business rules such as key layout,
 * expiry windows and status transitions must stay in the services.
 */
export const STORAGE_PROVIDERS = ["aws", "azure", "localstack"] as const;

export type StorageProvider = (typeof STORAGE_PROVIDERS)[number];

export interface UploadTarget {
  /** Short-lived URL the client can PUT the file to. */
  url: string;
  /** Always PUT for direct-to-storage uploads. */
  method: "PUT";
  /** Extra headers the client must send (for example Azure requires x-ms-blob-type). */
  headers: Record<string, string>;
}

export interface Storage {
  readonly provider: StorageProvider;

  /** Creates a short-lived upload target for the given object key. */
  createUploadTarget(
    key: string,
    contentType: string,
    expiresInSeconds?: number,
  ): Promise<UploadTarget>;

  /** Server-side upload used by the seed script. */
  uploadObject(key: string, body: Buffer, contentType: string): Promise<void>;

  /** Returns the URL the browser/player should use to read the object. */
  getPublicUrl(key: string): string;

  /** Deletes a single object. Missing objects are treated as success. */
  deleteObject(key: string): Promise<void>;

  /** Removes every object in the configured container. Used by the seed script. */
  emptyContainer(): Promise<void>;
}

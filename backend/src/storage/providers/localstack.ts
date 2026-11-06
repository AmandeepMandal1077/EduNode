import {
  getStorageContainer,
  getStorageCredentials,
  getStorageEndpoint,
  getStoragePresignEndpoint,
  getStoragePublicBaseUrl,
} from "../config.js";
import type { Storage } from "../types.js";
import { createS3Storage } from "./s3.js";

export const createLocalStackStorage = (): Storage => {
  const endpoint = getStorageEndpoint() || "http://localstack:4566";

  return createS3Storage({
    endpoint,
    presignEndpoint:
      getStoragePresignEndpoint() || "http://localhost:4566",
    forcePathStyle: true,
    credentials: getStorageCredentials() || {
      accessKeyId: "test",
      secretAccessKey: "test",
    },
    publicBaseUrl:
      getStoragePublicBaseUrl() ||
      `http://localhost:4566/${getStorageContainer()}`,
  });
};

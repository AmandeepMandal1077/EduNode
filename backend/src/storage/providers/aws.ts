import {
  getStorageCredentials,
  getStoragePublicBaseUrl,
} from "../config.js";
import type { Storage } from "../types.js";
import { createS3Storage } from "./s3.js";

export const createAwsStorage = (): Storage =>
  createS3Storage({
    credentials: getStorageCredentials(),
    publicBaseUrl: getStoragePublicBaseUrl(),
  });

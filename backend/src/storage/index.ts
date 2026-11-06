import { getStorageProvider } from "./config.js";
import { createAwsStorage } from "./providers/aws.js";
import { createAzureStorage } from "./providers/azure.js";
import { createLocalStackStorage } from "./providers/localstack.js";
import type { Storage, StorageProvider } from "./types.js";

/**
 * Provider registry. Adding another provider means adding one file and
 * one entry here — no service, controller or cron code changes.
 */
const registry: Record<StorageProvider, () => Storage> = {
  aws: createAwsStorage,
  azure: createAzureStorage,
  localstack: createLocalStackStorage,
};

let storage: Storage | null = null;

export const getStorage = (): Storage => {
  if (!storage) {
    const provider = getStorageProvider();
    storage = registry[provider]();
  }
  return storage;
};

/** Clears the singleton. Intended for tests. */
export const resetStorage = (): void => {
  storage = null;
};

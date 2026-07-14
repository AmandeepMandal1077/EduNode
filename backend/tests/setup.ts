import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// Load test environment variables before anything else
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "../.env.test") });

// Explicitly override in process.env
process.env.NODE_ENV = "test";
process.env.MONGO_URI = "mongodb://localhost:27018/lms_test?replicaSet=rs0&directConnection=true";
process.env.JWT_SECRET = "test-jwt-secret";
process.env.STRIPE_SECRET_KEY = "sk_test_mock";
process.env.REDIS_HOST_NAME = "localhost";
process.env.REDIS_PORT = "6380";
process.env.REDIS_PASSWORD = "testpass";
process.env.AWS_REGION = "us-east-1";
process.env.AWS_ACCESS_KEY_ID = "test-access-key";
process.env.AWS_SECRET_ACCESS_KEY = "test-secret-key";
process.env.AWS_S3_BUCKET_NAME = "test-bucket";
process.env.S3_BUCKET_NAME = "test-bucket";
process.env.INTERNAL_API_SECRET = "test-internal-secret";
process.env.FRONTEND_URL = "http://localhost:5173";
process.env.RAG_SERVER_URL = "http://localhost:8000";

import { beforeAll, afterAll, beforeEach, vi } from "vitest";
import mongoose from "mongoose";
import request from "supertest";
import { User } from "../src/models/user.model.js";

// --- IN-MEMORY CACHE MOCK ---
// Prefix variables with "mock" so Vitest allows referencing them inside hoisted vi.mock
export const mockLocalStore = new Map<string, string>();
export const localStore = mockLocalStore;

export const mockCache = {
  connect: vi.fn().mockResolvedValue(undefined),
  on: vi.fn(),
  get: vi.fn(async (key: string) => {
    return mockLocalStore.get(key) || null;
  }),
  set: vi.fn(async (key: string, value: string, options?: any) => {
    mockLocalStore.set(key, value);
    return "OK";
  }),
  type: vi.fn(async (key: string) => {
    return mockLocalStore.has(key) ? "string" : "none";
  }),
  incrByFloat: vi.fn(async (key: string, value: number) => {
    const current = parseFloat(mockLocalStore.get(key) || "0");
    const next = current + value;
    mockLocalStore.set(key, String(next));
    return next;
  }),
  pExpireAt: vi.fn().mockResolvedValue(true),
  del: vi.fn(async (key: string) => {
    const existed = mockLocalStore.has(key);
    mockLocalStore.delete(key);
    return existed ? 1 : 0;
  }),
  keys: vi.fn(async (pattern: string) => {
    const prefix = pattern.replace("*", "");
    return Array.from(mockLocalStore.keys()).filter((k) => k.startsWith(prefix));
  }),
  rename: vi.fn(async (oldKey: string, newKey: string) => {
    if (!mockLocalStore.has(oldKey)) {
      throw new Error("ERR no such key");
    }
    const val = mockLocalStore.get(oldKey)!;
    mockLocalStore.delete(oldKey);
    mockLocalStore.set(newKey, val);
  })
};

// Mock Cache Module
vi.mock("../src/cache/index.js", () => {
  return {
    default: mockCache,
    content_expiration_duration: 600000,
  };
});

// Mock ioredis Queue Connection
vi.mock("../src/queue/index.js", () => {
  return {
    default: {
      on: vi.fn()
    }
  };
});

// Mock Queue Workers and Jobs to prevent BullMQ initialization
export const mockAddForgotPasswordJob = vi.fn();
vi.mock("../src/queue/forgot-password.queue.js", () => {
  return {
    addForgotPasswordJob: mockAddForgotPasswordJob
  };
});



export const mockAddEmailJob = vi.fn();
vi.mock("../src/queue/email.queue.js", () => {
  return {
    addEmailJob: mockAddEmailJob,
  };
});

export const mockAddAnnouncementJob = vi.fn();
vi.mock("../src/queue/announcement.queue.js", () => {
  return {
    addAnnouncementJob: mockAddAnnouncementJob,
  };
});

// Mock Cron Jobs
vi.mock("../src/cron/syncHeatmaps.js", () => ({}));
vi.mock("../src/cron/syncProgress.js", () => ({}));

// Mock Stripe
vi.mock("stripe", () => {
  class MockStripe {
    checkout = {
      sessions: {
        create: vi.fn().mockResolvedValue({
          id: "cs_test_session_id",
          url: "https://checkout.stripe.com/test-session",
        }),
        retrieve: vi.fn().mockResolvedValue({
          id: "cs_test_session_id",
          payment_status: "paid",
          amount_total: 10000, // 100 * 100
          currency: "inr",
          metadata: {
            userId: "test-user-id",
            courseId: "test-course-id",
            courseOrderId: "test-order-id",
          },
          payment_intent: "pi_test_payment_intent",
        }),
      },
    };
    webhooks = {
      constructEventAsync: vi.fn(),
    };
  }
  return { default: MockStripe };
});

// Mock express-rate-limit to disable rate limiting in test environment
vi.mock("express-rate-limit", () => {
  return {
    default: () => (req: any, res: any, next: any) => next(),
  };
});

// Mock S3 Client and Presigner
vi.mock("@aws-sdk/client-s3", () => {
  return {
    S3Client: vi.fn(() => ({
      send: vi.fn(),
    })),
    PutObjectCommand: vi.fn(),
    DeleteObjectCommand: vi.fn(),
    DeleteObjectsCommand: vi.fn(),
  };
});

vi.mock("@aws-sdk/s3-request-presigner", () => ({
  getSignedUrl: vi.fn().mockResolvedValue("https://mock-presigned-url.s3.amazonaws.com"),
}));

vi.mock("../src/utils/s3.js", () => ({
  generatePresignedPutUrl: vi.fn().mockResolvedValue("https://mock-presigned-url.s3.amazonaws.com"),
  getPublicUrl: vi.fn((key: string) => `https://cdn.example.com/${key}`),
  deleteS3Object: vi.fn().mockResolvedValue(undefined),
  getS3Client: vi.fn(),
  getBucketName: vi.fn().mockReturnValue("test-bucket"),
  getPublicBaseUrl: vi.fn().mockReturnValue("https://cdn.example.com/"),
}));

// Mock Nodemailer
export const mockSendMail = vi.fn().mockResolvedValue({ messageId: "mock-id" });
vi.mock("nodemailer", () => {
  return {
    default: {
      createTransport: vi.fn().mockReturnValue({
        sendMail: mockSendMail,
      }),
    },
  };
});

// Database Connection & Clean up Lifecycle
beforeAll(async () => {
  vi.spyOn(console, "log").mockImplementation(() => {});
  vi.spyOn(console, "error").mockImplementation(() => {});

  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(process.env.MONGO_URI!);
  }
});

afterAll(async () => {
  vi.restoreAllMocks();
});

beforeEach(async () => {
  // Clear the in-memory Map
  mockLocalStore.clear();
  vi.clearAllMocks();

  // Clear MongoDB collections
  if (mongoose.connection.db) {
    const collections = await mongoose.connection.db.collections();
    for (const col of collections) {
      await col.deleteMany({});
    }
  }
});

// Helper functions for testing
export async function loginUser(app: any, email: string, password: string): Promise<string> {
  const response = await request(app)
    .post("/api/v1/users/signin")
    .send({ email, password });
  const cookies = response.headers["set-cookie"];
  if (!cookies || cookies.length === 0) {
    throw new Error(`Signin failed with status ${response.status}: ${JSON.stringify(response.body || response.text)}`);
  }
  return cookies[0]!.split(";")[0] || "";
}

export function mockUserId(): string {
  return new mongoose.Types.ObjectId().toString();
}

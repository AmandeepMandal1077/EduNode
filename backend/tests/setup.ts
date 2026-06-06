import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import { beforeAll, afterAll, beforeEach } from "vitest";

// Set mock env vars for testing
process.env.STRIPE_SECRET_KEY = "sk_test_mock";
process.env.JWT_SECRET = "jwt_test_secret";

let mongoServer: MongoMemoryServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

beforeEach(async () => {
  if (mongoose.connection.db) {
    const collections = await mongoose.connection.db.collections();
    for (const collection of collections) {
      await collection.deleteMany({});
    }
  }
});

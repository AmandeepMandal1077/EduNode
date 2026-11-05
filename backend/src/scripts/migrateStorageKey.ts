import mongoose from "mongoose";
import "dotenv/config";

/**
 * One-off migration from the provider-specific "s3Key" field to the
 * service-based "storageKey" field. Safe to run more than once.
 */
const COLLECTIONS = ["lectures", "mediauploads"] as const;

const migrate = async (): Promise<void> => {
  const uri = process.env.MONGO_URI;
  if (!uri) throw new Error("MONGO_URI is required");

  await mongoose.connect(uri);
  const db = mongoose.connection.db;
  if (!db) throw new Error("Database connection is not ready");

  for (const name of COLLECTIONS) {
    const collection = db.collection(name);
    const pending = await collection.countDocuments({
      s3Key: { $exists: true },
    });

    if (pending === 0) {
      console.log(`${name}: nothing to migrate`);
      continue;
    }

    const result = await collection.updateMany({ s3Key: { $exists: true } }, [
      { $set: { storageKey: { $ifNull: ["$storageKey", "$s3Key"] } } },
      { $unset: "s3Key" },
    ]);

    console.log(`${name}: migrated ${result.modifiedCount} document(s)`);
  }

  await mongoose.disconnect();
};

migrate().catch(async (error) => {
  console.error("Storage key migration failed:", error);
  await mongoose.disconnect();
  process.exit(1);
});

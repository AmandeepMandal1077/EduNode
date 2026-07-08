import { createClient } from "redis";
import dotenv from "dotenv";
dotenv.config();

const cache = createClient({
  url: `redis://:${process.env.REDIS_PASSWORD}@${process.env.REDIS_HOST_NAME}:${process.env.REDIS_PORT}`,
});

export const content_expiration_duration =
  process.env.CACHE_CONTENT_EXPIRATION_DUR || 600000;

const cacheConnect = async () => {
  try {
    await cache.connect();
  } catch (error) {
    console.error("Redis connection error:", error);
    throw error;
  }
};

cacheConnect();

cache.on("ready", () => {});
cache.on("connect", () => {});
cache.on("end", () => {});
cache.on("reconnecting", () => {});
cache.on("error", (err) => {
  console.error("Redis connection error:", err);
});

export default cache;

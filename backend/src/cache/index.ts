import { createClient } from "redis";
import dotenv from "dotenv";
import debug from "../utils/debug.js";
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
    debug("Redis connection error:", error);
    throw error;
  }
};

cacheConnect();

cache.on("ready", () => {
  debug("Redis connected");
});
cache.on("connect", () => {
  debug("Redis connecting");
});
cache.on("end", () => {
  debug("Redis disconnected");
});
cache.on("reconnecting", () => {
  debug("Redis reconnecting");
});
cache.on("error", (err) => {
  debug("Redis connection error:", err);
});

export default cache;

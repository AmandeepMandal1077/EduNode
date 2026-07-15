import { Redis } from "ioredis";
import dotenv from "dotenv";
import debug from "../utils/debug.js";
dotenv.config();

const queueRedis = new Redis(
  `redis://:${process.env.REDIS_PASSWORD}@${process.env.REDIS_HOST_NAME}:${process.env.REDIS_PORT}`,
  {
    maxRetriesPerRequest: null,
  },
);

queueRedis.on("connect", () => {
  debug("Queue Redis connected");
});

queueRedis.on("error", (err) => {
  debug("Queue Redis connection error:", err);
});
export default queueRedis;

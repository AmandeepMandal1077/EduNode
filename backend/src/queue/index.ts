import { Redis } from "ioredis";
import dotenv from "dotenv";
dotenv.config();

const queueRedis = new Redis(
  `redis://:${process.env.REDIS_PASSWORD}@${process.env.REDIS_HOST_NAME}:${process.env.REDIS_PORT}`,
  {
    maxRetriesPerRequest: null,
  },
);

queueRedis.on("connect", () => {
});

queueRedis.on("error", (err) => {
  console.error("Queue Redis connection error:", err);
});
export default queueRedis;

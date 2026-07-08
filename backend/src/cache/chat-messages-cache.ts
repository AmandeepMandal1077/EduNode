import type { IChatMessage } from "../models/chatMessage.model.js";
import { CacheKeys, generateKey } from "./keys.js";
import { getJSON, setJSON } from "./query.js";
import cache, { content_expiration_duration } from "./index.js";

export const saveChatMessagesToCache = async (
  userId: string,
  courseId: string,
  lectureId: string,
  messages: IChatMessage[],
) => {
  const key = generateKey(CacheKeys.CHAT_MESSAGES, `${userId}:${courseId}:${lectureId}`);
  await setJSON<IChatMessage[]>(
    key,
    messages,
    new Date(Date.now() + Number(content_expiration_duration)),
  );
};

export const getChatMessagesFromCache = async (
  userId: string,
  courseId: string,
  lectureId: string,
): Promise<IChatMessage[] | null> => {
  const key = generateKey(CacheKeys.CHAT_MESSAGES, `${userId}:${courseId}:${lectureId}`);
  return await getJSON<IChatMessage[]>(key);
};

export const invalidateChatMessagesInCache = async (
  userId: string,
  courseId: string,
  lectureId: string,
) => {
  const key = generateKey(CacheKeys.CHAT_MESSAGES, `${userId}:${courseId}:${lectureId}`);
  await cache.del(key);
};

import type { ICourse } from "../models/course.model.js";
import { CacheKeys, generateKey } from "./keys.js";
import { getJSON, setJSON } from "./query.js";
import cache, { content_expiration_duration } from "./index.js";

export const savePublishedCoursesToCache = async (courses: ICourse[]) => {
  // const key = generateKey(CacheKeys.PUBLISHED_COURSES, userId);
  const key = CacheKeys.PUBLISHED_COURSES;
  await setJSON<ICourse[]>(
    key,
    courses,
    new Date(Date.now() + Number(content_expiration_duration)),
  );
};

export const getPublishedCoursesFromCache = async () => {
  const key = CacheKeys.PUBLISHED_COURSES;
  const val = await getJSON<ICourse[]>(key);
  return val;
};

export const invalidatePublishedCoursesInCache = async () => {
  const key = CacheKeys.PUBLISHED_COURSES;
  await cache.del(key);
};

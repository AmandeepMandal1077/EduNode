export enum CacheKeys {
  PUBLISHED_COURSES = "published_courses",
  LECTURE_PROGRESS = "lecture_progress",
  LECTURE_HEATMAP = "lecture_heatmap",
  CHAT_MESSAGES = "chat_messages",
}

export const generateKey = (key: string, identifier: string) => {
  return `${key}:${identifier}`;
};

export enum CacheKeys {
  PUBLISHED_COURSES = "published_courses",
  LECTURE_PROGRESS = "lecture_progress",
  LECTURE_HEATMAP = "lecture_heatmap"
}

export const generateKey = (key: string, identifier: string) => {
  return `${key}:${identifier}`;
};

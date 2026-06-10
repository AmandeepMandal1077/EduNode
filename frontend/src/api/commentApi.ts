/**
 * commentApi.ts
 * All calls that map to /api/v1/comment
 *
 * Backend route reference  (all require auth):
 *   POST   /api/v1/comment/           → writeComment  { lectureId, content, parentCommentId? }
 *   POST   /api/v1/comment/like       → likeComment   { commentId }
 *   POST   /api/v1/comment/dislike    → dislikeComment { commentId }
 *   DELETE /api/v1/comment/           → deleteComment  { commentId }
 *
 * NOTE: fetching comments for a lecture is not yet a dedicated route.
 *       This file is structured so it can be extended easily.
 */

import apiClient from "./client";

export interface BackendComment {
  _id: string;
  lectureId: string;
  userId: {
    _id: string;
    name: string;
    avatar?: string;
  } | string;
  content: string;
  likes: number;
  dislikes: number;
  parentCommentId?: string;
  replyCount: number;
  isDeleted: boolean;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

// ── API calls ─────────────────────────────────────────────────────────────────

/**
 * @desc: Write a new top-level comment or reply to an existing one
 * @input: payload (object containing lectureId: string, content: string, parentCommentId?: string)
 * @return: Promise<BackendComment>
 * @access: Private
 */
export async function postComment(payload: {
  lectureId: string;
  content: string;
  parentCommentId?: string;
}): Promise<BackendComment> {
  const res = await apiClient.post("/comment", payload);
  return res.data?.data?.comment ?? res.data?.comment;
}

/**
 * @desc: Toggle a like/upvote on a specific comment
 * @input: lectureId (string), commentId (string)
 * @return: Promise<BackendComment>
 * @access: Private
 */
export async function likeComment(lectureId: string, commentId: string): Promise<BackendComment> {
  const res = await apiClient.post("/comment/like", { lectureId, commentId });
  return res.data?.data?.comment ?? res.data?.comment;
}

/**
 * @desc: Toggle a dislike/downvote on a specific comment
 * @input: lectureId (string), commentId (string)
 * @return: Promise<BackendComment>
 * @access: Private
 */
export async function dislikeComment(lectureId: string, commentId: string): Promise<BackendComment> {
  const res = await apiClient.post("/comment/dislike", { lectureId, commentId });
  return res.data?.data?.comment ?? res.data?.comment;
}

/**
 * @desc: Soft-delete a comment by changing its deleted flag
 * @input: lectureId (string), commentId (string)
 * @return: Promise<void>
 * @access: Private
 */
export async function deleteComment(lectureId: string, commentId: string): Promise<void> {
  await apiClient.delete("/comment", { data: { lectureId, commentId } });
}

export interface FetchCommentsResponse {
  comments: BackendComment[];
  likedCommentIds: string[];
  dislikedCommentIds: string[];
}

/**
 * @desc: Fetch all comments associated with a specific lecture
 * @input: lectureId (string)
 * @return: Promise<FetchCommentsResponse>
 * @access: Private
 */
export async function fetchLectureComments(lectureId: string): Promise<FetchCommentsResponse> {
  const res = await apiClient.get(`/lecture/${lectureId}/comments`);
  const data = res.data?.data ?? res.data ?? {};
  return {
    comments: data.comments ?? [],
    likedCommentIds: data.likedCommentIds ?? [],
    dislikedCommentIds: data.dislikedCommentIds ?? [],
  };
}

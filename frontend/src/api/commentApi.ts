
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



/**
 * @desc Write a new top-level comment or reply to an existing one.
 * @input {Object} payload - Contains lectureId, content, and optional parentCommentId.
 * @output {Promise<BackendComment>} The newly created or updated comment.
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
 * @desc Toggle a like/upvote on a specific comment.
 * @input {string} lectureId - The ID of the lecture.
 * @input {string} commentId - The ID of the comment.
 * @output {Promise<BackendComment>} The updated comment.
 */
export async function likeComment(lectureId: string, commentId: string): Promise<BackendComment> {
  const res = await apiClient.post("/comment/like", { lectureId, commentId });
  return res.data?.data?.comment ?? res.data?.comment;
}

/**
 * @desc Toggle a dislike/downvote on a specific comment.
 * @input {string} lectureId - The ID of the lecture.
 * @input {string} commentId - The ID of the comment.
 * @output {Promise<BackendComment>} The updated comment.
 */
export async function dislikeComment(lectureId: string, commentId: string): Promise<BackendComment> {
  const res = await apiClient.post("/comment/dislike", { lectureId, commentId });
  return res.data?.data?.comment ?? res.data?.comment;
}

/**
 * @desc Soft-delete a comment by changing its deleted flag.
 * @input {string} lectureId - The ID of the lecture.
 * @input {string} commentId - The ID of the comment.
 * @output {Promise<void>} Resolves when the comment is deleted.
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
 * @desc Fetch all comments associated with a specific lecture.
 * @input {string} lectureId - The ID of the lecture.
 * @output {Promise<FetchCommentsResponse>} The comments and user's reaction states.
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

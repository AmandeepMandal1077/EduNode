/**
 * commentService.ts
 * Business-logic adapter for comments.
 * Maps BackendComment -> Comment (frontend type) and structures replies hierarchically.
 */

import {
  fetchLectureComments,
  postComment,
  likeComment as apiLikeComment,
  dislikeComment as apiDislikeComment,
  deleteComment as apiDeleteComment,
  type BackendComment,
} from "../api/commentApi";
import type { Comment } from "../types";

function mapComment(bc: BackendComment): Comment {
  const userId = typeof bc.userId === "string" ? bc.userId : bc.userId?._id ?? "";
  const userName = typeof bc.userId === "string" ? "User" : bc.userId?.name ?? "User";
  const userAvatar = typeof bc.userId === "string" ? "" : bc.userId?.avatar ?? "";

  return {
    id: bc._id,
    userId,
    userName,
    userAvatar,
    courseId: "", // Optional/unused in pages
    lectureId: bc.lectureId,
    content: bc.isDeleted ? "[Comment deleted]" : bc.content,
    upvotes: bc.likes - bc.dislikes, // Balance of likes and dislikes as score
    createdAt: bc.createdAt,
    replies: [],
  };
}

export interface GetCommentsResult {
  comments: Comment[];
  likedCommentIds: string[];
  dislikedCommentIds: string[];
}

/**
 * @desc: Fetches and builds a hierarchical tree of comments for a lecture
 * @input: lectureId (string)
 * @return: Promise<GetCommentsResult>
 * @access: Private (requires authentication)
 */
export async function getCommentsForLecture(lectureId: string): Promise<GetCommentsResult> {
  try {
    const { comments: rawComments, likedCommentIds, dislikedCommentIds } = await fetchLectureComments(lectureId);
    
    // 1. Map all raw comments
    const allMapped = rawComments.map(mapComment);
    const commentMap = new Map<string, Comment>();
    allMapped.forEach((c) => commentMap.set(c.id, c));

    const topLevelComments: Comment[] = [];

    // 2. Nest comments hierarchically
    rawComments.forEach((bc) => {
      const mapped = commentMap.get(bc._id);
      if (!mapped) return;

      const parentId = bc.parentCommentId;
      // If it has a parent that is different from itself, it is a reply
      if (parentId && parentId !== bc._id) {
        const parent = commentMap.get(parentId);
        if (parent) {
          parent.replies.push(mapped);
        } else {
          // Fallback if parent not found in list (e.g. parent comment was hard deleted or missing)
          topLevelComments.push(mapped);
        }
      } else {
        // It is a top-level comment
        topLevelComments.push(mapped);
      }
    });

    // Recursively sort comments and all levels of nested replies in reverse chronological order
    sortCommentsRecursive(topLevelComments);

    return {
      comments: topLevelComments,
      likedCommentIds,
      dislikedCommentIds,
    };
  } catch (error) {
    console.error("Failed to fetch lecture comments", error);
    return {
      comments: [],
      likedCommentIds: [],
      dislikedCommentIds: [],
    };
  }
}

function sortCommentsRecursive(comments: Comment[]) {
  comments.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  comments.forEach((c) => {
    if (c.replies && c.replies.length > 0) {
      sortCommentsRecursive(c.replies);
    }
  });
}

/**
 * @desc: Post a comment or a reply to a lecture
 * @input: lectureId (string), content (string), parentCommentId (string, optional), currentUser (object, optional)
 * @return: Promise<Comment>
 * @access: Private (requires authentication)
 */
export async function addComment(
  lectureId: string,
  content: string,
  parentCommentId?: string,
  currentUser?: { id: string; name: string; avatarUrl?: string } | null
): Promise<Comment> {
  const bc = await postComment({ lectureId, content, parentCommentId });
  const mapped = mapComment(bc);
  if (currentUser && mapped.userId === currentUser.id) {
    mapped.userName = currentUser.name;
    mapped.userAvatar = currentUser.avatarUrl ?? "";
  }
  return mapped;
}

/**
 * @desc: Toggle like/upvote status on a comment
 * @input: lectureId (string), commentId (string)
 * @return: Promise<Comment>
 * @access: Private (requires authentication)
 */
export async function upvoteComment(lectureId: string, commentId: string): Promise<Comment> {
  const bc = await apiLikeComment(lectureId, commentId);
  return mapComment(bc);
}

/**
 * @desc: Toggle dislike/downvote status on a comment
 * @input: lectureId (string), commentId (string)
 * @return: Promise<Comment>
 * @access: Private (requires authentication)
 */
export async function downvoteComment(lectureId: string, commentId: string): Promise<Comment> {
  const bc = await apiDislikeComment(lectureId, commentId);
  return mapComment(bc);
}

/**
 * @desc: Soft-delete a comment
 * @input: lectureId (string), commentId (string)
 * @return: Promise<void>
 * @access: Private (requires authentication)
 */
export async function removeComment(lectureId: string, commentId: string): Promise<void> {
  await apiDeleteComment(lectureId, commentId);
}

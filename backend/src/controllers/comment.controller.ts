import type { Response } from "express";
import { Comment, CommentLike, CommentDislike } from "../models/comment.model.js";
import type { AuthenticatedRequest } from "../types/user.js";
import { asyncHandler } from "../utils/asynchandler.js";
import mongoose from "mongoose";
import { ApiError } from "../utils/apiError.js";

/**
 * Write a comment
 * @route POST /api/v1/comment
 */
export const writeComment = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const { lectureId, content, parentCommentId } = req.body;
    if (!lectureId || !content) {
      throw new ApiError("All fields are required", 400);
    }
    if (!mongoose.Types.ObjectId.isValid(lectureId)) {
      throw new ApiError("Invalid lectureId", 400);
    }

    if (parentCommentId && !mongoose.Types.ObjectId.isValid(parentCommentId)) {
      throw new ApiError("Invalid parentCommentId", 400);
    }
    const userId = req.userId;
    const comment = await Comment.create({
      lectureId: new mongoose.Types.ObjectId(lectureId),
      userId: new mongoose.Types.ObjectId(userId),
      content,
    });

    comment.parentCommentId = comment._id;
    if (parentCommentId) {
      const parentcomment = await Comment.findOne({
        _id: new mongoose.Types.ObjectId(parentCommentId),
        lectureId: new mongoose.Types.ObjectId(lectureId),
      });
      if (!parentcomment) {
        throw new ApiError("Parent comment not found", 404);
      }

      parentcomment.replyCount = parentcomment.replyCount || 0;
      parentcomment.replyCount++;
      await parentcomment.save();
      comment.parentCommentId = parentcomment._id;
    }

    await comment.save();
    res.status(201).json({
      success: true,
      message: "Comment created successfully",
      data: { comment },
    });
  },
);

/**
 * Like a comment
 * @route POST /api/v1/comment/like
 */
export const likeComment = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const { lectureId, commentId } = req.body;
    if (!lectureId || !commentId) {
      throw new ApiError("All fields are required", 400);
    }
    if (!mongoose.Types.ObjectId.isValid(lectureId)) {
      throw new ApiError("Invalid lectureId", 400);
    }
    if (!mongoose.Types.ObjectId.isValid(commentId)) {
      throw new ApiError("Invalid commentId", 400);
    }
    const userId = req.userId;
    const comment = await Comment.findOne({
      _id: new mongoose.Types.ObjectId(commentId),
      lectureId: new mongoose.Types.ObjectId(lectureId),
    });
    if (!comment) {
      throw new ApiError("Comment not found", 404);
    }

    await comment.likeComment(userId); //saved in method
    res.status(200).json({
      success: true,
      message: "Comment liked successfully",
      data: { comment },
    });
  },
);

/**
 * Dislike a comment
 * @route POST /api/v1/comment/dislike
 */
export const dislikeComment = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const { lectureId, commentId } = req.body;
    if (!lectureId || !commentId) {
      throw new ApiError("All fields are required", 400);
    }
    if (!mongoose.Types.ObjectId.isValid(lectureId)) {
      throw new ApiError("Invalid lectureId", 400);
    }
    if (!mongoose.Types.ObjectId.isValid(commentId)) {
      throw new ApiError("Invalid commentId", 400);
    }
    const userId = req.userId;
    const comment = await Comment.findOne({
      _id: new mongoose.Types.ObjectId(commentId),
      lectureId: new mongoose.Types.ObjectId(lectureId),
    });
    if (!comment) {
      throw new ApiError("Comment not found", 404);
    }

    await comment.dislikeComment(userId); //saved in method
    res.status(200).json({
      success: true,
      message: "Comment disliked successfully",
      data: { comment },
    });
  },
);

/**
 * Delete a comment
 * @route DELETE /api/v1/comment/:id
 */
export const deleteComment = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const { lectureId, commentId } = req.body;
    if (!lectureId || !commentId) {
      throw new ApiError("All fields are required", 400);
    }
    if (!mongoose.Types.ObjectId.isValid(lectureId)) {
      throw new ApiError("Invalid lectureId", 400);
    }
    if (!mongoose.Types.ObjectId.isValid(commentId)) {
      throw new ApiError("Invalid commentId", 400);
    }
    const comment = await Comment.findOne({
      _id: new mongoose.Types.ObjectId(commentId),
      lectureId: new mongoose.Types.ObjectId(lectureId),
    });
    if (!comment) {
      throw new ApiError("Comment not found", 404);
    }

    comment.deleteComment(); //saved in method
    res.status(200).json({
      success: true,
      message: "Comment deleted successfully",
      data: { comment },
    });
  },
);

/**
 * Get comments for a lecture
 * @route GET /api/v1/lecture/:lectureId/comments
 */
export const getComments = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const { lectureId } = req.params;
    if (!lectureId) {
      throw new ApiError("All fields are required", 400);
    }
    if (!mongoose.Types.ObjectId.isValid(lectureId)) {
      throw new ApiError("Invalid lectureId", 400);
    }
    const comments = await Comment.find({
      lectureId: new mongoose.Types.ObjectId(lectureId),
    }).populate({
      path: "userId",
      select: "name",
    });

    // Fetch active user's likes and dislikes for comments of this lecture
    const commentIds = comments.map(c => c._id);
    const userId = req.userId;

    const userLikes = await CommentLike.find({
      userId: new mongoose.Types.ObjectId(userId),
      commentId: { $in: commentIds }
    }).select("commentId");

    const userDislikes = await CommentDislike.find({
      userId: new mongoose.Types.ObjectId(userId),
      commentId: { $in: commentIds }
    }).select("commentId");

    const likedCommentIds = userLikes.map(l => l.commentId.toString());
    const dislikedCommentIds = userDislikes.map(d => d.commentId.toString());

    return res.status(200).json({
      success: true,
      message: "Comments fetched successfully",
      data: { 
        comments,
        likedCommentIds,
        dislikedCommentIds
      },
    });
  },
);


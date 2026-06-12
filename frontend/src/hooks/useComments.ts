import { useState, useCallback } from "react";
import {
  getCommentsForLecture,
  addComment,
  upvoteComment,
  downvoteComment,
  removeComment,
} from "@/services/commentService";
import type { Comment, Lecture, User } from "@/types";

export function useComments(currentLecture: Lecture | null, currentUser: User | null) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [newCommentText, setNewCommentText] = useState("");
  const [replyingToId, setReplyingToId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");

  const [likedCommentIds, setLikedCommentIds] = useState<Set<string>>(new Set());
  const [dislikedCommentIds, setDislikedCommentIds] = useState<Set<string>>(new Set());

  const loadComments = useCallback(async () => {
    if (!currentLecture) return;
    setCommentsLoading(true);
    const result = await getCommentsForLecture(currentLecture.id);
    setComments(result.comments);
    setLikedCommentIds(new Set(result.likedCommentIds));
    setDislikedCommentIds(new Set(result.dislikedCommentIds));
    setCommentsLoading(false);
  }, [currentLecture]);

  const addReplyInTree = useCallback((list: Comment[], parentId: string, newReply: Comment): Comment[] => {
    return list.map((c) => {
      if (c.id === parentId) {
        const updatedReplies = [newReply, ...(c.replies || [])];
        updatedReplies.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        return { ...c, replies: updatedReplies };
      }
      if (c.replies && c.replies.length > 0) {
        return { ...c, replies: addReplyInTree(c.replies, parentId, newReply) };
      }
      return c;
    });
  }, []);

  const deleteCommentInTree = useCallback((list: Comment[], targetId: string): Comment[] => {
    return list.map((c) => {
      if (c.id === targetId) {
        return { ...c, content: "[Comment deleted]" };
      }
      if (c.replies && c.replies.length > 0) {
        return { ...c, replies: deleteCommentInTree(c.replies, targetId) };
      }
      return c;
    });
  }, []);

  const updateVoteInTree = useCallback((list: Comment[], targetId: string, newUpvotes: number): Comment[] => {
    return list.map((c) => {
      if (c.id === targetId) {
        return { ...c, upvotes: newUpvotes };
      }
      if (c.replies && c.replies.length > 0) {
        return { ...c, replies: updateVoteInTree(c.replies, targetId, newUpvotes) };
      }
      return c;
    });
  }, []);

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentLecture || !newCommentText.trim()) return;
    if (newCommentText.length > 500) {
      alert("Comment cannot exceed 500 characters.");
      return;
    }
    const added = await addComment(currentLecture.id, newCommentText.trim(), undefined, currentUser);
    setComments((prev) => [added, ...prev]);
    setNewCommentText("");
  };

  const handleAddReply = async (parentId: string) => {
    if (!currentLecture || !replyText.trim()) return;
    if (replyText.length > 500) {
      alert("Reply cannot exceed 500 characters.");
      return;
    }
    const added = await addComment(currentLecture.id, replyText.trim(), parentId, currentUser);
    setComments((prev) => addReplyInTree(prev, parentId, added));
    setReplyText("");
    setReplyingToId(null);
  };

  const handleVote = async (commentId: string, type: "up" | "down") => {
    if (!currentLecture || !currentUser) return;

    const isLiked = likedCommentIds.has(commentId);
    const isDisliked = dislikedCommentIds.has(commentId);

    const findComment = (list: Comment[], targetId: string): Comment | null => {
      for (const c of list) {
        if (c.id === targetId) return c;
        if (c.replies && c.replies.length > 0) {
          const res = findComment(c.replies, targetId);
          if (res) return res;
        }
      }
      return null;
    };
    const targetComment = findComment(comments, commentId);
    const currentUpvotes = targetComment ? targetComment.upvotes : 0;

    let diff = 0;
    const nextLiked = new Set(likedCommentIds);
    const nextDisliked = new Set(dislikedCommentIds);

    if (type === "up") {
      if (isLiked) {
        diff = -1;
        nextLiked.delete(commentId);
      } else {
        diff = 1;
        nextLiked.add(commentId);
        if (isDisliked) {
          diff += 1;
          nextDisliked.delete(commentId);
        }
      }
    } else {
      if (isDisliked) {
        diff = 1;
        nextDisliked.delete(commentId);
      } else {
        diff = -1;
        nextDisliked.add(commentId);
        if (isLiked) {
          diff -= 1;
          nextLiked.delete(commentId);
        }
      }
    }

    setLikedCommentIds(nextLiked);
    setDislikedCommentIds(nextDisliked);

    const newUpvotes = currentUpvotes + diff;
    setComments((prev) => updateVoteInTree(prev, commentId, newUpvotes));

    if (type === "up") {
      upvoteComment(currentLecture.id, commentId);
    } else {
      downvoteComment(currentLecture.id, commentId);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!currentLecture) return;
    await removeComment(currentLecture.id, commentId);
    setComments((prev) => deleteCommentInTree(prev, commentId));
  };

  const formatTimeAgo = (dateStr: string): string => {
    try {
      const date = new Date(dateStr);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffMins < 1) return "Just now";
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays === 1) return "Yesterday";
      if (diffDays < 7) return `${diffDays}d ago`;

      return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
    } catch {
      return "";
    }
  };

  return {
    comments,
    commentsLoading,
    newCommentText,
    setNewCommentText,
    replyingToId,
    setReplyingToId,
    replyText,
    setReplyText,
    likedCommentIds,
    dislikedCommentIds,
    loadComments,
    handleAddComment,
    handleAddReply,
    handleVote,
    handleDeleteComment,
    formatTimeAgo,
  };
}

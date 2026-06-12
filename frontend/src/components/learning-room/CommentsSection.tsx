import { useEffect } from "react";
import { Loader2, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CommentNode } from "./CommentNode";
import { useComments } from "@/hooks/useComments";
import type { Lecture, User } from "@/types";

interface CommentsSectionProps {
  currentLecture: Lecture | null;
  currentUser: User | null;
  activeTab: string;
}

export function CommentsSection({ currentLecture, currentUser, activeTab }: CommentsSectionProps) {
  const {
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
  } = useComments(currentLecture, currentUser);

  useEffect(() => {
    if (activeTab === "qa" && currentLecture) {
      loadComments();
    }
  }, [activeTab, currentLecture, loadComments]);

  return (
    <div className="space-y-6">
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
        <h3 className="font-bold text-slate-800 text-lg mb-4 flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-indigo-500" />
          Ask a Question
        </h3>
        <form onSubmit={handleAddComment}>
          <textarea
            value={newCommentText}
            onChange={(e) => setNewCommentText(e.target.value)}
            placeholder="What's on your mind? Ask a question or share your thoughts on this lecture..."
            rows={3}
            maxLength={500}
            className="w-full rounded-xl border border-slate-200 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-colors resize-none mb-2"
          />
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">{newCommentText.length}/500</span>
            <Button
              type="submit"
              disabled={!newCommentText.trim() || !currentUser}
              className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-md disabled:bg-slate-300"
            >
              Post Question
            </Button>
          </div>
          {!currentUser && (
            <p className="text-xs text-rose-500 mt-2 font-medium">You must be logged in to post comments.</p>
          )}
        </form>
      </div>

      <div className="space-y-4">
        <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
          Discussion <Badge variant="secondary" className="bg-slate-100 text-slate-600 ml-1">{comments.length}</Badge>
        </h3>

        {commentsLoading ? (
          <div className="py-12 flex justify-center">
            <Loader2 className="w-6 h-6 text-indigo-500 animate-spin" />
          </div>
        ) : comments.length === 0 ? (
          <div className="py-12 text-center bg-slate-50 border border-slate-100 rounded-2xl">
            <MessageSquare className="w-8 h-8 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 font-medium">No questions yet.</p>
            <p className="text-sm text-slate-400 mt-1">Be the first to start a discussion on this lecture!</p>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            {comments.map((comment) => (
              <CommentNode
                key={comment.id}
                comment={comment}
                depth={0}
                currentUser={currentUser}
                likedCommentIds={likedCommentIds}
                dislikedCommentIds={dislikedCommentIds}
                replyingToId={replyingToId}
                setReplyingToId={setReplyingToId}
                replyText={replyText}
                setReplyText={setReplyText}
                handleVote={handleVote}
                handleDeleteComment={handleDeleteComment}
                handleAddReply={handleAddReply}
                formatTimeAgo={formatTimeAgo}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

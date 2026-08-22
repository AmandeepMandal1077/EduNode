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
      <div className="bg-background border-2 border-border rounded-base p-6 shadow-shadow">
        <h3 className="font-heading font-black text-foreground text-lg mb-4 flex items-center gap-2">
          <div className="w-8 h-8 rounded-base bg-main border-2 border-border flex items-center justify-center shadow-[1px_1px_0px_0px_#000]">
            <MessageSquare className="w-4 h-4 text-main-foreground" />
          </div>
          Ask a Question
        </h3>
        <form onSubmit={handleAddComment}>
          <textarea
            value={newCommentText}
            onChange={(e) => setNewCommentText(e.target.value)}
            placeholder="What's on your mind? Ask a question or share your thoughts on this lecture..."
            rows={3}
            maxLength={500}
            className="w-full rounded-base border-2 border-border p-3 text-sm font-base bg-secondary-background focus:outline-hidden focus:ring-2 focus:ring-black transition-all resize-none mb-3 text-foreground placeholder:text-foreground/50"
          />
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold text-foreground/60">{newCommentText.length}/500</span>
            <Button
              type="submit"
              variant="default"
              disabled={!newCommentText.trim() || !currentUser}
              className="font-heading font-black shadow-[2px_2px_0px_0px_#000] cursor-pointer"
            >
              Post Question
            </Button>
          </div>
          {!currentUser && (
            <p className="text-xs font-heading font-bold text-red-600 mt-2">You must be logged in to post comments.</p>
          )}
        </form>
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <h3 className="font-heading font-black text-foreground text-xl">
            Discussion
          </h3>
          <Badge variant="default" className="text-xs font-mono font-black">
            {comments.length}
          </Badge>
        </div>

        {commentsLoading ? (
          <div className="py-12 flex justify-center">
            <Loader2 className="w-6 h-6 text-foreground animate-spin" />
          </div>
        ) : comments.length === 0 ? (
          <div className="py-12 text-center bg-secondary-background border-2 border-border rounded-base p-6 shadow-shadow">
            <div className="w-12 h-12 rounded-base bg-main border-2 border-border flex items-center justify-center mx-auto mb-3 shadow-[2px_2px_0px_0px_#000]">
              <MessageSquare className="w-6 h-6 text-main-foreground" />
            </div>
            <p className="text-foreground font-heading font-bold text-base">No questions yet.</p>
            <p className="text-sm font-base text-foreground/70 mt-1">Be the first to start a discussion on this lecture!</p>
          </div>
        ) : (
          <div className="flex flex-col gap-5 bg-background border-2 border-border rounded-base p-6 shadow-shadow">
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

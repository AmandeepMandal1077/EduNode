import { cn } from "@/lib/utils";
import { ThumbsUp, ThumbsDown, CornerDownRight, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Comment, User } from "@/types";

export interface CommentNodeProps {
  comment: Comment;
  depth: number;
  currentUser: User | null;
  likedCommentIds: Set<string>;
  dislikedCommentIds: Set<string>;
  replyingToId: string | null;
  setReplyingToId: (id: string | null) => void;
  replyText: string;
  setReplyText: (text: string) => void;
  handleVote: (id: string, type: "up" | "down") => void;
  handleDeleteComment: (id: string) => void;
  handleAddReply: (parentId: string) => void;
  formatTimeAgo: (dateStr: string) => string;
}

export function CommentNode({
  comment,
  depth,
  currentUser,
  likedCommentIds,
  dislikedCommentIds,
  replyingToId,
  setReplyingToId,
  replyText,
  setReplyText,
  handleVote,
  handleDeleteComment,
  handleAddReply,
  formatTimeAgo,
}: CommentNodeProps) {
  const isReplyDeleted = comment.content === "[Comment deleted]";
  const avatarSize = depth === 0 ? "w-9 h-9 text-sm" : "w-7 h-7 text-xs";
  const initials = comment.userName.slice(0, 2).toUpperCase();

  const isLiked = likedCommentIds.has(comment.id);
  const isDisliked = dislikedCommentIds.has(comment.id);

  const MAX_DEPTH = 3;
  const canReply = depth < MAX_DEPTH;

  return (
    <div className="flex flex-col gap-2 group w-full mt-2.5">
      <div className="flex gap-3 items-start">
        <div
          className={cn(
            "bg-main border-2 border-border rounded-base flex items-center justify-center text-main-foreground font-heading font-black flex-shrink-0 select-none overflow-hidden shadow-[1px_1px_0px_0px_#000]",
            avatarSize
          )}
        >
          {comment.userAvatar ? (
            <img src={comment.userAvatar} alt={comment.userName} className="w-full h-full object-cover" />
          ) : (
            initials
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className={cn("font-heading font-black text-foreground", depth === 0 ? "text-sm" : "text-xs")}>
              {comment.userName}
            </span>
            <span className="text-[10px] font-mono text-foreground/60">{formatTimeAgo(comment.createdAt)}</span>
          </div>
          <p
            className={cn(
              "text-foreground/90 font-base leading-relaxed whitespace-pre-wrap break-all",
              depth === 0 ? "text-sm" : "text-xs",
              isReplyDeleted && "text-foreground/50 italic"
            )}
          >
            {comment.content}
          </p>

          <div className="flex items-center gap-3 mt-2 flex-wrap">
            <div className="flex items-center gap-1 border-2 border-border rounded-base p-0.5 bg-secondary-background">
              <button
                type="button"
                onClick={() => handleVote(comment.id, "up")}
                className={cn(
                  "transition-colors p-1 rounded-base hover:bg-main cursor-pointer",
                  isLiked ? "bg-main text-main-foreground font-black" : "text-foreground"
                )}
                title="Like"
              >
                <ThumbsUp className="w-3 h-3" />
              </button>
              <span className="text-xs font-mono font-bold text-foreground px-1">
                {comment.upvotes}
              </span>
              <button
                type="button"
                onClick={() => handleVote(comment.id, "down")}
                className={cn(
                  "transition-colors p-1 rounded-base hover:bg-main cursor-pointer",
                  isDisliked ? "bg-red-500 text-white font-black" : "text-foreground"
                )}
                title="Dislike"
              >
                <ThumbsDown className="w-3 h-3" />
              </button>
            </div>

            {!isReplyDeleted && canReply && (
              <button
                type="button"
                onClick={() => {
                  setReplyingToId(replyingToId === comment.id ? null : comment.id);
                  setReplyText("");
                }}
                className="text-xs font-heading font-bold text-foreground hover:bg-main transition-colors flex items-center gap-1 border border-border px-2 py-1 rounded-base cursor-pointer shadow-[1px_1px_0px_0px_#000]"
              >
                <CornerDownRight className="w-3 h-3" />
                Reply
              </button>
            )}

            {comment.userId === currentUser?.id && !isReplyDeleted && (
              <button
                type="button"
                onClick={() => handleDeleteComment(comment.id)}
                className="text-xs font-heading font-bold text-red-600 hover:bg-red-500 hover:text-white border border-border transition-all flex items-center gap-1 px-2 py-1 rounded-base ml-auto cursor-pointer"
                title="Delete"
              >
                <Trash2 className="w-3 h-3" />
                Delete
              </button>
            )}
          </div>
        </div>
      </div>

      {replyingToId === comment.id && (
        <div className="pl-10 flex flex-col gap-2 mt-2">
          <textarea
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            placeholder="Write a reply..."
            rows={2}
            maxLength={500}
            className="w-full rounded-base border-2 border-border p-2.5 text-sm font-base bg-secondary-background focus:outline-hidden focus:ring-2 focus:ring-black transition-all resize-none text-foreground"
          />
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-mono text-foreground/60">
              {replyText.length}/500
            </span>
            <div className="flex gap-2">
              <Button
                type="button"
                onClick={() => setReplyingToId(null)}
                variant="neutral"
                size="sm"
                className="text-xs h-8 px-3 cursor-pointer font-heading font-bold"
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={() => handleAddReply(comment.id)}
                disabled={!replyText.trim()}
                variant="default"
                size="sm"
                className="text-xs h-8 px-3 cursor-pointer font-heading font-black shadow-[1px_1px_0px_0px_#000]"
              >
                Reply
              </Button>
            </div>
          </div>
        </div>
      )}

      {comment.replies && comment.replies.length > 0 && (
        <div
          className="flex flex-col gap-2 border-l-2 border-border"
          style={{
            paddingLeft: `${depth === 0 ? 24 : depth === 1 ? 16 : 10}px`,
            marginLeft: `${depth === 0 ? 14 : depth === 1 ? 10 : 6}px`,
          }}
        >
          {comment.replies.map((reply) => (
            <CommentNode
              key={reply.id}
              comment={reply}
              depth={depth + 1}
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
  );
}

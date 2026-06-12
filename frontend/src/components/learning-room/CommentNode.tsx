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
  const avatarSize = depth === 0 ? "w-9 h-9 text-sm rounded-xl" : "w-7 h-7 text-xs rounded-lg";
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
            "bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 font-semibold flex-shrink-0 select-none overflow-hidden",
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
            <span className={cn("font-semibold text-slate-800", depth === 0 ? "text-sm" : "text-xs")}>
              {comment.userName}
            </span>
            <span className="text-[10px] text-slate-400">{formatTimeAgo(comment.createdAt)}</span>
          </div>
          <p
            className={cn(
              "text-slate-600 leading-relaxed whitespace-pre-wrap break-all",
              depth === 0 ? "text-sm" : "text-xs",
              isReplyDeleted && "text-slate-400 italic"
            )}
          >
            {comment.content}
          </p>

          <div className="flex items-center gap-4 mt-2 flex-wrap">
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => handleVote(comment.id, "up")}
                className={cn(
                  "transition-colors p-1 rounded hover:bg-slate-100 cursor-pointer",
                  isLiked ? "text-indigo-600 font-bold" : "text-slate-400 hover:text-indigo-600"
                )}
                title="Like"
              >
                <ThumbsUp className="w-3.5 h-3.5" />
              </button>
              <span className="text-xs font-medium text-slate-500 font-mono w-4 text-center">
                {comment.upvotes}
              </span>
              <button
                type="button"
                onClick={() => handleVote(comment.id, "down")}
                className={cn(
                  "transition-colors p-1 rounded hover:bg-slate-100 cursor-pointer",
                  isDisliked ? "text-rose-600 font-bold" : "text-slate-400 hover:text-rose-600"
                )}
                title="Dislike"
              >
                <ThumbsDown className="w-3.5 h-3.5" />
              </button>
            </div>

            {!isReplyDeleted && canReply && (
              <button
                type="button"
                onClick={() => {
                  setReplyingToId(replyingToId === comment.id ? null : comment.id);
                  setReplyText("");
                }}
                className="text-xs font-semibold text-slate-500 hover:text-indigo-600 transition-colors flex items-center gap-1 hover:bg-slate-100 px-1.5 py-0.5 rounded cursor-pointer"
              >
                <CornerDownRight className="w-3.5 h-3.5" />
                Reply
              </button>
            )}

            {comment.userId === currentUser?.id && !isReplyDeleted && (
              <button
                type="button"
                onClick={() => handleDeleteComment(comment.id)}
                className="text-xs font-semibold text-slate-400 hover:text-rose-600 hover:bg-slate-100 transition-all flex items-center gap-1 px-1.5 py-0.5 rounded ml-auto opacity-75 hover:opacity-100 cursor-pointer"
                title="Delete"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete
              </button>
            )}
          </div>
        </div>
      </div>

      {replyingToId === comment.id && (
        <div className="pl-12 flex flex-col gap-2 mt-1">
          <textarea
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            placeholder="Write a reply..."
            rows={2}
            maxLength={500}
            className="w-full rounded-xl border border-slate-200 p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-colors resize-none"
          />
          <span className="text-[10px] text-slate-400 text-right block mt-0.5">
            {replyText.length}/500
          </span>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              onClick={() => setReplyingToId(null)}
              variant="ghost"
              className="text-slate-500 hover:bg-slate-100 text-xs rounded-xl h-8 px-3 cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={() => handleAddReply(comment.id)}
              disabled={!replyText.trim()}
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs rounded-xl h-8 px-3 cursor-pointer"
            >
              Reply
            </Button>
          </div>
        </div>
      )}

      {comment.replies && comment.replies.length > 0 && (
        <div
          className="flex flex-col gap-1 border-l border-slate-100"
          style={{
            paddingLeft: `${depth === 0 ? 32 : depth === 1 ? 20 : 12}px`,
            marginLeft: `${depth === 0 ? 16 : depth === 1 ? 12 : 8}px`,
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

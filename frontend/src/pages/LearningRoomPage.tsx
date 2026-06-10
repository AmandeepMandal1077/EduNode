import { useEffect, useState, useCallback, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import {
  ChevronLeft,
  ChevronRight,
  Check,
  Play,
  FileText,
  Download,
  MessageSquare,
  Loader2,
  BookOpen,
  Menu,
  X,
  Bell,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { VideoPlayer } from "@/components/VideoPlayer";
import { AIChatFAB } from "@/components/AIChatFAB";
import {
  getCommentsForLecture,
  addComment,
  upvoteComment,
  downvoteComment,
  removeComment,
} from "@/services/commentService";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "@/store";
import {
  fetchCourseDetailsThunk,
  fetchCourseProgressThunk,
  updateLectureProgressThunk,
} from "@/store/courseSlice";
import type { Lecture, Comment } from "@/types";
import { cn } from "@/lib/utils";
import { ThumbsUp, ThumbsDown, CornerDownRight, Trash2 } from "lucide-react";
import { getCourseAnnouncements } from "@/services/courseService";
import type { BackendAnnouncement } from "@/api/courseApi";



interface CommentNodeProps {
  comment: Comment;
  depth: number;
  currentUser: any;
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

function CommentNode({
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

  // Maximum nesting limit: top-level (0) + 3 child comments (max depth = 3)
  const MAX_DEPTH = 3;
  const canReply = depth < MAX_DEPTH;

  return (
    <div className="flex flex-col gap-2 group w-full mt-2.5">
      {/* Comment Header + Content */}
      <div className="flex gap-3 items-start">
        <div className={cn(
          "bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 font-semibold flex-shrink-0 select-none overflow-hidden",
          avatarSize
        )}>
          {comment.userAvatar ? (
            <img src={comment.userAvatar} alt={comment.userName} className="w-full h-full object-cover" />
          ) : (
            initials
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className={cn(
              "font-semibold text-slate-800",
              depth === 0 ? "text-sm" : "text-xs"
            )}>
              {comment.userName}
            </span>
            <span className="text-[10px] text-slate-400">{formatTimeAgo(comment.createdAt)}</span>
          </div>
          <p className={cn(
            "text-slate-600 leading-relaxed whitespace-pre-wrap break-all",
            depth === 0 ? "text-sm" : "text-xs",
            isReplyDeleted && "text-slate-400 italic"
          )}>
            {comment.content}
          </p>

          {/* Actions */}
          <div className="flex items-center gap-4 mt-2 flex-wrap">
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => handleVote(comment.id, "up")}
                className={cn(
                  "transition-colors p-1 rounded hover:bg-slate-100",
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
                  "transition-colors p-1 rounded hover:bg-slate-100",
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

      {/* Reply Form (Inline) */}
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
          <span className="text-[10px] text-slate-400 text-right block mt-0.5">{replyText.length}/500</span>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              onClick={() => setReplyingToId(null)}
              variant="ghost"
              className="text-slate-500 hover:bg-slate-100 text-xs rounded-xl h-8 px-3"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={() => handleAddReply(comment.id)}
              disabled={!replyText.trim()}
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs rounded-xl h-8 px-3"
            >
              Reply
            </Button>
          </div>
        </div>
      )}

      {/* Replies Section (Recursive) */}
      {comment.replies.length > 0 && (
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

export function LearningRoomPage() {
  const { courseId, lectureId } = useParams<{ courseId: string; lectureId: string }>();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();

  const [currentLecture, setCurrentLecture] = useState<Lecture | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  const [comments, setComments] = useState<Comment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [newCommentText, setNewCommentText] = useState("");
  const [replyingToId, setReplyingToId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");

  const { currentUser } = useSelector((state: RootState) => state.auth);
  const course = useSelector((state: RootState) => state.course.selectedCourse);
  const completedLecturesList = useSelector(
    (state: RootState) => state.course.completedLectures[courseId || ""] ?? []
  );

  const completedIds = useMemo(() => new Set(completedLecturesList), [completedLecturesList]);

  const [likedCommentIds, setLikedCommentIds] = useState<Set<string>>(new Set());
  const [dislikedCommentIds, setDislikedCommentIds] = useState<Set<string>>(new Set());

  const [announcements, setAnnouncements] = useState<BackendAnnouncement[]>([]);
  const [announcementsLoading, setAnnouncementsLoading] = useState(false);

  const loadComments = useCallback(async () => {
    if (!currentLecture) return;
    setCommentsLoading(true);
    const result = await getCommentsForLecture(currentLecture.id);
    setComments(result.comments);
    setLikedCommentIds(new Set(result.likedCommentIds));
    setDislikedCommentIds(new Set(result.dislikedCommentIds));
    setCommentsLoading(false);
  }, [currentLecture]);

  useEffect(() => {
    if (activeTab === "qa" && currentLecture) {
      loadComments();
    }
  }, [activeTab, currentLecture, loadComments]);

  const addReplyInTree = useCallback((list: Comment[], parentId: string, newReply: Comment): Comment[] => {
    return list.map((c) => {
      if (c.id === parentId) {
        const updatedReplies = [newReply, ...c.replies];
        // Sort replies in reverse chronological order
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

    // Calculate optimistic counts:
    // We search the comments tree recursively to find the target comment
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
    let nextLiked = new Set(likedCommentIds);
    let nextDisliked = new Set(dislikedCommentIds);

    if (type === "up") {
      if (isLiked) {
        // Unlike: liked state is toggled off
        diff = -1;
        nextLiked.delete(commentId);
      } else {
        // Like: toggled on
        diff = 1;
        nextLiked.add(commentId);
        if (isDisliked) {
          diff += 1; // remove dislike (+1) and add like (+1) = +2 diff
          nextDisliked.delete(commentId);
        }
      }
    } else {
      if (isDisliked) {
        // Undislike: toggled off
        diff = 1;
        nextDisliked.delete(commentId);
      } else {
        // Dislike: toggled on
        diff = -1;
        nextDisliked.add(commentId);
        if (isLiked) {
          diff -= 1; // remove like (-1) and add dislike (-1) = -2 diff
          nextLiked.delete(commentId);
        }
      }
    }

    setLikedCommentIds(nextLiked);
    setDislikedCommentIds(nextDisliked);

    // Update UI immediately (optimistically)
    const newUpvotes = currentUpvotes + diff;
    setComments((prev) => updateVoteInTree(prev, commentId, newUpvotes));

    // Call backend API in the background (we do not await it here, which prevents the stale return payload from overwriting the optimistic state)
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

  // Fetch course details, progress, and announcements on mount or courseId change
  useEffect(() => {
    if (!courseId) return;
    setLoading(true);
    setAnnouncementsLoading(true);
    Promise.all([
      dispatch(fetchCourseDetailsThunk(courseId)),
      dispatch(fetchCourseProgressThunk(courseId)),
      getCourseAnnouncements(courseId).then((list) => setAnnouncements(list)),
    ]).finally(() => {
      setLoading(false);
      setAnnouncementsLoading(false);
    });
  }, [dispatch, courseId]);

  // Determine selected lecture when course metadata or lectureId changes
  useEffect(() => {
    if (course) {
      let found = false;
      for (const mod of course.modules) {
        const lec = mod.lectures.find((l) => l.id === lectureId);
        if (lec) {
          setCurrentLecture(lec);
          found = true;
          break;
        }
      }
      // Fallback if lectureId is not found
      if (!found && course.modules[0]?.lectures[0]) {
        setCurrentLecture(course.modules[0].lectures[0]);
      }
    }
  }, [course, lectureId]);

  const handleProgress = useCallback(
    async (watched: number) => {
      if (!courseId || !currentLecture) return;
      dispatch(
        updateLectureProgressThunk({
          courseId,
          lectureId: currentLecture.id,
          watchedSeconds: watched,
          totalSeconds: currentLecture.durationSeconds,
        })
      );
    },
    [dispatch, courseId, currentLecture]
  );

  const handleToggleCompletion = async (e: React.MouseEvent, targetLecId: string, durationSecs: number) => {
    e.stopPropagation();
    if (!courseId) return;

    const isCurrentlyCompleted = completedIds.has(targetLecId);
    dispatch(
      updateLectureProgressThunk({
        courseId,
        lectureId: targetLecId,
        watchedSeconds: isCurrentlyCompleted ? 0 : durationSecs,
        totalSeconds: durationSecs,
      })
    );
  };

  // Flat list of all lectures across all modules
  const allLectures = course?.modules.flatMap((m) => m.lectures) ?? [];
  const currentIndex = allLectures.findIndex((l) => l.id === lectureId);
  const prevLecture = currentIndex > 0 ? allLectures[currentIndex - 1] : null;
  const nextLecture = currentIndex < allLectures.length - 1 ? allLectures[currentIndex + 1] : null;

  const navigateTo = (lec: Lecture) => navigate(`/learn/${courseId}/lecture/${lec.id}`);

  if (loading) {
    return (
      <div className="h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  if (!course || !currentLecture) {
    return (
      <div className="h-screen bg-slate-50 flex flex-col items-center justify-center gap-4 text-slate-800">
        <p className="font-semibold text-slate-650">Lecture not found.</p>
        <Button onClick={() => navigate("/my-courses")} variant="outline" className="rounded-xl border-slate-200">
          Back to My Courses
        </Button>
      </div>
    );
  }

  return (
    <div className="h-screen bg-slate-50 flex flex-col overflow-hidden">
      {/* ── Top bar ─────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-slate-200 bg-white flex-shrink-0 z-10">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/my-courses")}
            className="text-slate-500 hover:text-slate-800 transition-colors p-1.5 rounded-lg hover:bg-slate-100 cursor-pointer"
            aria-label="Back to my courses"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="hidden sm:block">
            <p className="text-xs text-slate-400 truncate max-w-xs">{course.title}</p>
            <p className="text-sm font-bold text-slate-800 truncate max-w-sm">{currentLecture.title}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="ghost"
            disabled={!prevLecture}
            onClick={() => prevLecture && navigateTo(prevLecture)}
            className="text-slate-600 hover:text-slate-900 hover:bg-slate-100 disabled:opacity-30 text-xs h-8 px-3 rounded-lg cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Prev
          </Button>
          <Button
            size="sm"
            variant="ghost"
            disabled={!nextLecture}
            onClick={() => nextLecture && navigateTo(nextLecture)}
            className="text-slate-600 hover:text-slate-900 hover:bg-slate-100 disabled:opacity-30 text-xs h-8 px-3 rounded-lg cursor-pointer"
          >
            Next
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </div>

      {/* ── Main area: Strict 12-Column Grid ─────────────────────── */}
      <div className="max-w-screen-2xl w-full mx-auto p-4 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 min-h-0 overflow-hidden">

        {/* Left: Video + Tabs (lg:col-span-9) */}
        <div className="lg:col-span-9 h-full overflow-y-auto pr-1 flex flex-col gap-6 scrollbar-thin">

          {/* Video Player Card */}
          <div className="max-w-4xl mx-auto w-full aspect-video rounded-2xl overflow-hidden border border-slate-200 bg-black shadow-sm relative flex-shrink-0">
            <VideoPlayer
              title={currentLecture.title}
              duration={currentLecture.durationSeconds}
              onProgress={handleProgress}
              className="h-full w-full"
            />
          </div>

          {/* Tabs Section Bento Card */}
          <div className="max-w-4xl mx-auto w-full p-6 bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col gap-4">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col w-full">
              <TabsList className="bg-slate-100 border border-slate-200/60 rounded-xl flex-shrink-0 w-fit p-1 mb-2">
                <TabsTrigger
                  value="overview"
                  className="text-xs text-slate-500 data-[state=active]:text-indigo-700 data-[state=active]:bg-white data-[state=active]:shadow-sm flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg cursor-pointer"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  Overview
                </TabsTrigger>
                <TabsTrigger
                  value="resources"
                  className="text-xs text-slate-500 data-[state=active]:text-indigo-700 data-[state=active]:bg-white data-[state=active]:shadow-sm flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5" />
                  Resources
                </TabsTrigger>
                <TabsTrigger
                  value="qa"
                  className="text-xs text-slate-500 data-[state=active]:text-indigo-700 data-[state=active]:bg-white data-[state=active]:shadow-sm flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg cursor-pointer"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  Q&A
                </TabsTrigger>
                <TabsTrigger
                  value="announcements"
                  className="text-xs text-slate-500 data-[state=active]:text-indigo-700 data-[state=active]:bg-white data-[state=active]:shadow-sm flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg cursor-pointer"
                >
                  <Bell className="w-3.5 h-3.5" />
                  Announcements
                  {announcements.length > 0 && (
                    <span className="bg-indigo-600 text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center leading-none">
                      {announcements.length}
                    </span>
                  )}
                </TabsTrigger>
              </TabsList>

              <div className="mt-2 min-h-[200px]">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.15, ease: "easeInOut" }}
                  >
                    {activeTab === "overview" && (
                      <div className="bg-slate-50 border border-slate-100 rounded-xl p-5 text-slate-600">
                        <h2 className="text-slate-800 font-bold text-base mb-2 break-words">{currentLecture.title}</h2>
                        <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{currentLecture.description}</p>
                        <div className="grid grid-cols-3 gap-3 mt-5">
                          {[
                            { label: "Lecture", value: `${currentIndex + 1} / ${allLectures.length}` },
                            { label: "Duration", value: currentLecture.duration },
                            { label: "Completed", value: `${completedIds.size} lectures` },
                          ].map((item) => (
                            <div key={item.label} className="bg-white border border-slate-200/65 rounded-xl px-4 py-3 shadow-xs">
                              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">{item.label}</p>
                              <p className="text-sm font-semibold text-slate-800">{item.value}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {activeTab === "resources" && (
                      <div className="bg-slate-50 border border-slate-100 rounded-xl p-5">
                        {currentLecture.resources.length > 0 ? (
                          <div className="flex flex-col gap-2">
                            {currentLecture.resources.map((r) => (
                              <div
                                key={r.id}
                                className="flex items-center gap-3 p-3 rounded-lg bg-white border border-slate-200/80 hover:bg-slate-100 cursor-pointer transition-colors shadow-xs"
                              >
                                <Download className="w-4 h-4 text-indigo-500 flex-shrink-0" />
                                <span className="text-sm text-slate-700 flex-1">{r.title}</span>
                                <Badge variant="secondary" className="text-[10px] bg-slate-100 text-slate-500 border-slate-200 py-0">
                                  {r.type.toUpperCase()}
                                </Badge>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="flex flex-col items-center justify-center py-8 gap-2">
                            <FileText className="w-8 h-8 text-slate-300" />
                            <p className="text-slate-400 text-sm">No resources attached to this lecture.</p>
                          </div>
                        )}
                      </div>
                    )}

                    {activeTab === "qa" && (
                      <div className="flex flex-col gap-6">
                        {/* Ask a Question Form */}
                        <form onSubmit={handleAddComment} className="flex flex-col gap-3">
                          <div className="flex gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold flex-shrink-0 select-none overflow-hidden">
                              {currentUser?.avatarUrl ? (
                                <img src={currentUser.avatarUrl} alt={currentUser.name} className="w-full h-full object-cover" />
                              ) : (
                                currentUser?.name?.slice(0, 2).toUpperCase() || "ME"
                              )}
                            </div>
                            <div className="flex-1">
                              <textarea
                                value={newCommentText}
                                onChange={(e) => setNewCommentText(e.target.value)}
                                placeholder="Ask a question or leave a comment about this lecture..."
                                rows={3}
                                maxLength={500}
                                className="w-full rounded-xl border border-slate-200 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-colors resize-none"
                              />
                              <span className="text-[10px] text-slate-400 text-right block mt-1">{newCommentText.length}/500</span>
                            </div>
                          </div>
                          <div className="flex justify-end">
                            <Button
                              type="submit"
                              disabled={!newCommentText.trim()}
                              className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl px-4 py-2 text-xs"
                            >
                              Post Question
                            </Button>
                          </div>
                        </form>

                        <div className="border-t border-slate-100 my-2" />

                        {/* Comments List */}
                        {commentsLoading ? (
                          <div className="flex items-center justify-center py-12">
                            <Loader2 className="w-6 h-6 text-indigo-600 animate-spin" />
                          </div>
                        ) : comments.length === 0 ? (
                          <div className="flex flex-col items-center justify-center py-12 gap-3 text-center bg-slate-50 border border-slate-100 rounded-xl">
                            <MessageSquare className="w-8 h-8 text-slate-400" />
                            <p className="text-slate-700 text-sm font-semibold">No questions yet</p>
                            <p className="text-slate-405 text-xs max-w-xs leading-relaxed">
                              Be the first to ask a question! Your questions and answers will help fellow students.
                            </p>
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
                    )}

                    {activeTab === "announcements" && (
                      <div className="flex flex-col gap-3">
                        {announcementsLoading ? (
                          <div className="flex items-center justify-center py-12">
                            <Loader2 className="w-6 h-6 text-indigo-600 animate-spin" />
                          </div>
                        ) : announcements.length === 0 ? (
                          <div className="flex flex-col items-center justify-center py-12 gap-3 text-center bg-slate-50 border border-slate-100 rounded-xl">
                            <Bell className="w-8 h-8 text-slate-400" />
                            <p className="text-slate-700 text-sm font-semibold">No announcements yet</p>
                            <p className="text-slate-405 text-xs max-w-xs leading-relaxed text-slate-500">
                              Important updates or announcements about the course will show up here.
                            </p>
                          </div>
                        ) : (
                          announcements.map((ann) => (
                            <div key={ann._id} className="bg-slate-50 border border-slate-100 rounded-xl p-4 flex gap-3 shadow-xs">
                              <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                                <Bell className="w-4 h-4 text-indigo-500" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-2 mb-1">
                                  <p className="text-sm font-bold text-slate-800 leading-snug">Course Update</p>
                                  <Badge className="bg-indigo-50 text-indigo-600 border border-indigo-100 text-[10px] flex-shrink-0">
                                    Notice
                                  </Badge>
                                </div>
                                <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-wrap break-all">{ann.message}</p>
                                <p className="text-[10px] text-slate-400 mt-1.5">{formatTimeAgo(ann.sentAt)}</p>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>
            </Tabs>
          </div>
        </div>

        {/* Right: Playlist Sidebar (lg:col-span-3) */}
        <div className="lg:col-span-3 h-full overflow-hidden bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col">
          <div className="h-full flex flex-col min-w-[260px] w-full">
            {/* Sidebar header */}
            <div className="px-4 py-3 bg-slate-50/60 border-b border-slate-200 flex-shrink-0">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Lectures
              </p>
              <p className="text-xs text-slate-400 mt-0.5 font-medium">
                {completedIds.size} / {allLectures.length} completed
              </p>
            </div>

            {/* Flat lecture list — scrollable */}
            <div
              className="flex-1 min-h-0 overflow-y-auto"
              style={{ overscrollBehavior: "contain" }}
            >
              {allLectures.map((lec, idx) => {
                const isActive = lec.id === lectureId;
                const isDone = completedIds.has(lec.id);
                return (
                  <button
                    key={lec.id}
                    onClick={() => navigateTo(lec)}
                    className={cn(
                      "w-full flex items-start gap-3 px-4 py-3.5 text-left transition-colors border-b border-slate-100 hover:bg-slate-50/80 cursor-pointer",
                      isActive && "bg-indigo-50/50 border-l-3 border-indigo-500"
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={isDone}
                      onClick={(e) => handleToggleCompletion(e, lec.id, lec.durationSeconds)}
                      onChange={() => { }}
                      className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 mt-1 cursor-pointer accent-indigo-600 flex-shrink-0"
                    />
                    {/* Index / status badge */}
                    <div
                      className={cn(
                        "w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 text-[10px] font-bold transition-colors",
                        isDone
                          ? "bg-emerald-500 text-white"
                          : isActive
                            ? "bg-indigo-600 text-white"
                            : "bg-slate-100 text-slate-500 border border-slate-200"
                      )}
                    >
                      {isDone ? (
                        <Check className="w-3.5 h-3.5" />
                      ) : isActive ? (
                        <Play className="w-3 h-3 fill-white ml-0.5" />
                      ) : (
                        <span>{idx + 1}</span>
                      )}
                    </div>

                    {/* Title + duration */}
                    <div className="flex-1 min-w-0">
                      <p
                        className={cn(
                          "text-xs font-bold leading-snug transition-colors break-words",
                          isActive
                            ? "text-indigo-700"
                            : isDone
                              ? "text-slate-400 font-medium"
                              : "text-slate-600"
                        )}
                      >
                        {lec.title}
                      </p>
                      <p className="text-[10px] text-slate-400 mt-0.5 font-medium">{lec.duration}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* AI Chat FAB */}
      <AIChatFAB />
    </div>
  );
}

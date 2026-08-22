import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { MessageCircle, X, Send, Bot, User, Sparkles } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "@/store";
import { fetchChatHistoryThunk, sendChatMessageThunk } from "@/store/chatSlice";

function TypingDots() {
  return (
    <div className="flex items-center gap-1.5 px-4 py-3">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="w-2.5 h-2.5 rounded-full bg-foreground"
          animate={{ y: [0, -6, 0] }}
          transition={{
            duration: 0.6,
            repeat: Infinity,
            delay: i * 0.15,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}

export function AIChatFAB({ courseId, lectureId }: { courseId?: string; lectureId?: string }) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const panelRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const dispatch = useDispatch<AppDispatch>();

  const chatKey = courseId && lectureId ? `${courseId}:${lectureId}` : "";
  const messages = useSelector((state: RootState) => state.chat.messages[chatKey] ?? []);
  const sending = useSelector((state: RootState) => state.chat.sending);
  const loading = useSelector((state: RootState) => state.chat.loading);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (open && panelRef.current && !panelRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open]);

  useEffect(() => {
    if (open && courseId && lectureId && messages.length === 0) {
      dispatch(fetchChatHistoryThunk({ courseId, lectureId }));
    }
  }, [open, courseId, lectureId, dispatch, messages.length]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending]);

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed || !courseId || !lectureId || sending) return;
    setInput("");
    dispatch(sendChatMessageThunk({ courseId, lectureId, question: trimmed }));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      <AnimatePresence>
        {!open && (
          <motion.button
            key="fab"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            onClick={() => setOpen(true)}
            className="fab-breathe fixed bottom-6 right-6 z-50 w-14 h-14 rounded-base bg-main text-main-foreground border-2 border-border flex items-center justify-center shadow-shadow hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all cursor-pointer"
            aria-label="Open AI Chat"
            id="ai-chat-fab"
          >
            <MessageCircle className="w-6 h-6" />
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {open && (
          <motion.div
            ref={panelRef}
            key="chat-panel"
            initial={{ x: "100%", opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "100%", opacity: 0 }}
            transition={{ type: "spring", stiffness: 280, damping: 28 }}
            className="fixed bottom-0 right-0 z-50 flex flex-col shadow-shadow rounded-tl-base rounded-bl-base overflow-hidden border-l-4 border-t-4 border-border bg-background"
            style={{
              width: 400,
              height: "min(640px, 90vh)",
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b-2 border-border bg-main flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-base bg-background border-2 border-border flex items-center justify-center shadow-[1px_1px_0px_0px_#000]">
                  <Bot className="w-4 h-4 text-foreground" />
                </div>
                <div>
                  <p className="text-main-foreground font-heading font-black text-sm">EduNode AI</p>
                  <p className="text-main-foreground/80 text-xs font-base">Your Contextual Tutor</p>
                </div>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="text-main-foreground hover:bg-background/30 rounded-base p-1 cursor-pointer transition-colors"
                aria-label="Close chat"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto px-4 py-4 bg-background" style={{ minHeight: 0 }}>
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="flex gap-2">
                    {[0, 1, 2].map((i) => (
                      <div
                        key={i}
                        className="w-3 h-3 bg-main border border-border rounded-full animate-bounce"
                        style={{ animationDelay: `${i * 0.15}s` }}
                      />
                    ))}
                  </div>
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full gap-4 text-center px-6">
                  <div className="w-14 h-14 rounded-base bg-main border-2 border-border flex items-center justify-center shadow-[2px_2px_0px_0px_#000]">
                    <Sparkles className="w-7 h-7 text-main-foreground" />
                  </div>
                  <div>
                    <p className="text-base font-heading font-black text-foreground mb-1">
                      Ask Anything About This Lecture
                    </p>
                    <p className="text-xs font-base text-foreground/70 leading-relaxed">
                      I can answer questions based on the video transcription and course materials.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {messages.map((msg) => (
                    <motion.div
                      key={msg._id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2 }}
                      className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                      {msg.role === "assistant" && (
                        <div className="w-7 h-7 rounded-base bg-main border-2 border-border flex items-center justify-center mr-2 mt-1 flex-shrink-0 shadow-[1px_1px_0px_0px_#000]">
                          <Bot className="w-3.5 h-3.5 text-main-foreground" />
                        </div>
                      )}
                      <div
                        className={`max-w-[80%] px-3.5 py-2.5 rounded-base text-sm leading-relaxed border-2 border-border shadow-[2px_2px_0px_0px_#000] ${
                          msg.role === "user"
                            ? "bg-main text-main-foreground font-medium"
                            : "bg-secondary-background text-foreground font-base"
                        }`}
                      >
                        {msg.content}
                      </div>
                      {msg.role === "user" && (
                        <div className="w-7 h-7 rounded-base bg-background border-2 border-border flex items-center justify-center ml-2 mt-1 flex-shrink-0 shadow-[1px_1px_0px_0px_#000]">
                          <User className="w-3.5 h-3.5 text-foreground" />
                        </div>
                      )}
                    </motion.div>
                  ))}

                  {sending && (
                    <div className="flex justify-start">
                      <div className="w-7 h-7 rounded-base bg-main border-2 border-border flex items-center justify-center mr-2 mt-1 flex-shrink-0 shadow-[1px_1px_0px_0px_#000]">
                        <Bot className="w-3.5 h-3.5 text-main-foreground" />
                      </div>
                      <div className="bg-secondary-background border-2 border-border rounded-base shadow-[2px_2px_0px_0px_#000]">
                        <TypingDots />
                      </div>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            {/* Input Area */}
            <div className="flex-shrink-0 border-t-2 border-border p-3 bg-secondary-background">
              <div className="flex items-center gap-2">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask a question about this lecture..."
                  disabled={sending}
                  className="flex-1 h-10 bg-background font-base"
                  id="ai-chat-input"
                />
                <Button
                  onClick={handleSend}
                  disabled={!input.trim() || sending}
                  size="icon"
                  variant="default"
                  className="h-10 w-10 flex-shrink-0 shadow-[2px_2px_0px_0px_#000] cursor-pointer"
                  aria-label="Send message"
                  id="ai-chat-send"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

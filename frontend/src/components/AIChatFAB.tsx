import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { MessageCircle, X, Send, Bot, User, Sparkles } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import ScrollArea from "@/components/shadix-ui/components/smooth-scroll-area/scroll-area";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "@/store";
import { fetchChatHistoryThunk, sendChatMessageThunk } from "@/store/chatSlice";


function TypingDots() {
  return (
    <div className="flex items-center gap-1 px-4 py-3">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="w-2 h-2 rounded-full bg-indigo-400"
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

  // Fetch chat history when panel opens
  useEffect(() => {
    if (open && courseId && lectureId && messages.length === 0) {
      dispatch(fetchChatHistoryThunk({ courseId, lectureId }));
    }
  }, [open, courseId, lectureId, dispatch, messages.length]);

  // Auto-scroll to bottom on new messages
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
            className="fab-breathe fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-xl hover:bg-indigo-700 transition-colors"
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
            className="fixed bottom-0 right-0 z-50 flex flex-col shadow-2xl rounded-tl-2xl rounded-bl-2xl overflow-hidden"
            style={{
              width: 400,
              height: "min(640px, 90vh)",
              background: "white",
              border: "1px solid #e0e7ff",
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-indigo-100 bg-indigo-600 flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-white font-semibold text-sm">EduNode AI</p>
                  <p className="text-indigo-200 text-xs">Your study assistant</p>
                </div>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="text-white/80 hover:text-white transition-colors rounded p-1 hover:bg-white/10"
                aria-label="Close chat"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto px-4 py-4" style={{ minHeight: 0 }}>
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="flex gap-1.5">
                    {[0, 1, 2].map((i) => (
                      <div
                        key={i}
                        className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce"
                        style={{ animationDelay: `${i * 0.15}s` }}
                      />
                    ))}
                  </div>
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full gap-4 text-center px-6">
                  <div className="w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center">
                    <Sparkles className="w-7 h-7 text-indigo-500" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800 mb-1">
                      Ask anything about this lecture
                    </p>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      I can answer questions based on the lecture content. Try asking about key concepts, definitions, or explanations.
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
                        <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center mr-2 mt-1 flex-shrink-0">
                          <Bot className="w-3.5 h-3.5 text-indigo-600" />
                        </div>
                      )}
                      <div
                        className={`max-w-[80%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
                          msg.role === "user"
                            ? "bg-indigo-600 text-white rounded-br-md"
                            : "bg-slate-100 text-slate-800 rounded-bl-md"
                        }`}
                      >
                        {msg.content}
                      </div>
                      {msg.role === "user" && (
                        <div className="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center ml-2 mt-1 flex-shrink-0">
                          <User className="w-3.5 h-3.5 text-white" />
                        </div>
                      )}
                    </motion.div>
                  ))}

                  {sending && (
                    <div className="flex justify-start">
                      <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center mr-2 mt-1 flex-shrink-0">
                        <Bot className="w-3.5 h-3.5 text-indigo-600" />
                      </div>
                      <div className="bg-slate-100 rounded-2xl rounded-bl-md">
                        <TypingDots />
                      </div>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            {/* Input Area */}
            <div className="flex-shrink-0 border-t border-slate-100 p-3 bg-white">
              <div className="flex items-center gap-2">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask about this lecture..."
                  disabled={sending}
                  className="flex-1 h-10 rounded-xl border-slate-200 bg-slate-50 text-sm placeholder:text-slate-400 focus-visible:ring-indigo-400"
                  id="ai-chat-input"
                />
                <Button
                  onClick={handleSend}
                  disabled={!input.trim() || sending}
                  size="icon"
                  className="h-10 w-10 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white flex-shrink-0 disabled:opacity-50"
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

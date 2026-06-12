import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { MessageCircle, X, Send, Bot, User, Sparkles, Lock } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import ScrollArea from "@/components/shadix-ui/components/smooth-scroll-area/scroll-area";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

const INITIAL_MESSAGES: Message[] = [
  {
    id: "init",
    role: "assistant",
    content:
      "Hi! I'm your AI study assistant. Ask me anything about this course — I can explain concepts, quiz you, or suggest resources.",
    timestamp: new Date(),
  },
];

const AI_RESPONSES = [
  "Great question! This concept builds on what we covered in the previous module. The key thing to remember is that every abstraction has a cost, and understanding that cost is what separates good engineers from great ones.",
  "That's a common point of confusion. Let me break it down step by step for you. First, think of it like a pipeline — each stage transforms the data before passing it along.",
  "Excellent! You're thinking about this the right way. The underlying principle here is separation of concerns — keep your logic isolated so each piece can be tested independently.",
  "I can recommend a few resources for this topic. Check out the official documentation and the linked GitHub repository in the Resources tab for deeper dives and live examples.",
  "Let me give you a quick quiz to test your understanding! What happens when you call this function with a null argument — does it throw, return undefined, or handle it gracefully?",
  "This is covered in detail in the next lecture. The short answer: it depends on your use case, but the general rule is to prefer composition over inheritance.",
];

export function AIChatFAB({ courseId }: { courseId?: string }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom whenever messages change
  useEffect(() => {
    if (open && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isTyping, open]);

  // Click outside to close
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

  const underDevelopment = true;

  const sendMessage = async () => {
    const text = input.trim();
    if (!text) return;

    const userMsg: Message = {
      id: `u-${Date.now()}`,
      role: "user",
      content: text,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    await new Promise((r) => setTimeout(r, 1000 + Math.random() * 800));

    const aiMsg: Message = {
      id: `a-${Date.now()}`,
      role: "assistant",
      content: AI_RESPONSES[Math.floor(Math.random() * AI_RESPONSES.length)],
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, aiMsg]);
    setIsTyping(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <>
      {/* FAB Button */}
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

      {/* Chat Panel */}
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
              width: 384,
              height: "min(600px, 90vh)",
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

            {underDevelopment ? (
              <div className="flex-1 flex flex-col items-center justify-center p-6 bg-white text-slate-800">
                <div className="flex flex-col items-center gap-3">
                  <Bot className="w-8 h-8 text-indigo-600 animate-pulse" />
                  <p className="text-sm font-semibold text-slate-700 tracking-tight">
                    EduNode AI coming soon
                  </p>
                </div>
              </div>
            ) : (
              <>
                {/* Messages — ScrollArea for smooth scrolling */}
                <ScrollArea
                  className="flex-1 min-h-0"
                >
                  <div className="px-4 py-4">
                  <div className="flex flex-col gap-3">
                    {messages.map((msg) => (
                      <motion.div
                        key={msg.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2 }}
                        className={`flex gap-2.5 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}
                      >
                        <div
                          className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${msg.role === "assistant" ? "bg-indigo-100" : "bg-slate-200"
                            }`}
                        >
                          {msg.role === "assistant" ? (
                            <Bot className="w-3.5 h-3.5 text-indigo-600" />
                          ) : (
                            <User className="w-3.5 h-3.5 text-slate-600" />
                          )}
                        </div>
                        <div
                          className={`max-w-[78%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap break-all ${msg.role === "assistant"
                            ? "bg-slate-100 text-slate-800 rounded-tl-sm"
                            : "bg-indigo-600 text-white rounded-tr-sm"
                            }`}
                        >
                          {msg.content}
                        </div>
                      </motion.div>
                    ))}

                    {isTyping && (
                      <div className="flex gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                          <Bot className="w-3.5 h-3.5 text-indigo-600" />
                        </div>
                        <div className="bg-slate-100 px-4 py-3 rounded-2xl rounded-tl-sm flex items-center gap-1">
                          {[0, 1, 2].map((i) => (
                            <motion.span
                              key={i}
                              className="w-1.5 h-1.5 bg-slate-400 rounded-full block"
                              animate={{ y: [0, -4, 0] }}
                              transition={{ duration: 0.6, delay: i * 0.15, repeat: Infinity }}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                    <div ref={bottomRef} />
                  </div>
                  </div>
                </ScrollArea>

                {/* Input — flex-shrink-0 so it never collapses */}
                <div className="flex-shrink-0 px-4 py-3 border-t border-slate-100 flex gap-2 bg-white">
                  <Input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    maxLength={300}
                    placeholder="Ask anything about this lecture..."
                    className="flex-1 text-sm border-slate-200 focus-visible:ring-indigo-500/30"
                    id="ai-chat-input"
                  />
                  <Button
                    onClick={sendMessage}
                    size="sm"
                    disabled={!input.trim() || isTyping}
                    className="bg-indigo-600 hover:bg-indigo-700 px-3 flex-shrink-0"
                    aria-label="Send message"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

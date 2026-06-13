import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { MessageCircle, X, Send, Bot, User, Sparkles, Lock } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import ScrollArea from "@/components/shadix-ui/components/smooth-scroll-area/scroll-area";



export function AIChatFAB({ courseId }: { courseId?: string }) {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

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
              width: 384,
              height: "min(600px, 90vh)",
              background: "white",
              border: "1px solid #e0e7ff",
            }}
          >
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

              <div className="flex-1 flex flex-col items-center justify-center p-6 bg-white text-slate-800">
                <div className="flex flex-col items-center gap-3">
                  <Bot className="w-8 h-8 text-indigo-600 animate-pulse" />
                  <p className="text-sm font-semibold text-slate-700 tracking-tight">
                    EduNode AI coming soon
                  </p>
                </div>
              </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

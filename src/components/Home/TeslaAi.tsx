"use client";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getTeslaAnalysis } from "@/app/actions";

export default function TeslaAIHub() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<
    { role: "user" | "assistant"; content: string }[]
  >([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // --- AUTO-WELCOME LOGIC ---
  useEffect(() => {
    const hasVisited = localStorage.getItem("tesla_ai_welcomed");
    if (!hasVisited) {
      setTimeout(() => {
        setIsOpen(true);
        setMessages([
          {
            role: "assistant",
            content:
              "Neural Link Established. Welcome to the Tesla-X Ecosystem. Official nodes: https://tesla-x-investment.vercel.app | Market Data: https://tesla-stockbox.vercel.app. How can I assist your deployment?",
          },
        ]);
        localStorage.setItem("tesla_ai_welcomed", "true");
      }, 2000); // 2 second delay for premium feel
    }
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight);
  }, [messages, isLoading]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    setIsError(false);
    const userMsg = { role: "user" as const, content: input };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    const result = await getTeslaAnalysis([...messages, userMsg] as any);

    if (result.success) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: result.message || "" },
      ]);
    } else {
      setIsError(true);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "CRITICAL ERROR: NEURAL LINK DISCONNECTED. VISIT https://tesla-x-investment.vercel.app",
        },
      ]);
      setTimeout(() => setIsError(false), 2000);
    }
    setIsLoading(false);
  };

  return (
    <div className="fixed bottom-6 left-6 md:bottom-10 md:left-10 z-[100] flex flex-col items-start">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            className={`mb-6 w-[85vw] md:w-[400px] h-[550px] md:h-[620px] bg-black/70 backdrop-blur-[50px] border border-white/10 rounded-[2.8rem] shadow-[0_0_100px_rgba(0,0,0,0.8)] flex flex-col overflow-hidden transition-all duration-300 ${isError ? "animate-glitch" : ""}`}
          >
            {/* Header */}
            <div className="p-7 border-b border-white/5 bg-white/5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={`w-1.5 h-1.5 rounded-full ${isError ? "bg-red-500" : "bg-primary"} animate-pulse shadow-[0_0_10px_#E31937]`}
                />
                <span className="text-white font-black text-[10px] uppercase tracking-[0.5em]">
                  System.Tesla-X
                </span>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-white/20 hover:text-white transition-colors text-[10px] font-black tracking-widest"
              >
                EXIT
              </button>
            </div>

            {/* Chat Body */}
            <div
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-8 space-y-6 scrollbar-hide"
            >
              {messages.map((m, i) => (
                <div
                  key={i}
                  className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`px-6 py-4 rounded-[2rem] text-[13px] leading-relaxed max-w-[88%] ${
                      m.role === "user"
                        ? "bg-primary text-white font-bold shadow-lg shadow-primary/20"
                        : "bg-white/5 text-gray-300 border border-white/10 backdrop-blur-md"
                    }`}
                  >
                    {m.content}
                  </div>
                </div>
              ))}

              {isLoading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex gap-2 p-4 bg-white/5 border border-white/10 rounded-[1.5rem] w-20"
                >
                  <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                  <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                  <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce"></span>
                </motion.div>
              )}
            </div>

            {/* Input Bar */}
            <form
              onSubmit={handleSend}
              className="p-8 bg-black/40 border-t border-white/10 flex gap-4 items-center relative"
            >
              <div className="relative flex-1 group">
                <div className="absolute -inset-[1px] rounded-full bg-gradient-to-r from-primary/50 via-transparent to-blue-500/50 opacity-0 group-focus-within:opacity-100 blur-md transition-opacity duration-500" />
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="What would you like to do..."
                  className="relative w-full bg-[#0a0a0a] border border-white/10 rounded-full px-7 py-4 text-white text-xs focus:outline-none focus:border-primary/40 transition-all backdrop-blur-xl"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="relative w-14 h-14 flex items-center justify-center group shrink-0"
              >
                <div className="absolute inset-0 rounded-full border border-white/20 group-hover:border-primary/50 transition-colors duration-500" />
                <div className="absolute inset-[2px] bg-[#050505] rounded-full shadow-inner shadow-white/5" />
                <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-primary opacity-0 group-hover:opacity-100 group-hover:rotate-180 transition-all duration-700" />
                <div
                  className={`relative z-10 transition-transform duration-500 group-hover:scale-110 ${isLoading ? "animate-pulse" : ""}`}
                >
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    className="text-white group-hover:text-primary tesla-icon-glow"
                  >
                    <path
                      d="M12 19V5M5 12l7-7 7 7"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* THE TINY CURIOUS NEURAL BUTTON */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.15 }}
        whileTap={{ scale: 0.95 }}
        className="relative w-14 h-14 rounded-full flex items-center justify-center bg-black overflow-visible shadow-2xl"
      >
        <div className="absolute inset-[-2.5px] rounded-full p-[2px] overflow-hidden">
          <div className="absolute inset-0 tesla-btn-glow" />
          <div
            className="absolute inset-0 tesla-btn-glow"
            style={{ animationDelay: "-0.75s" }}
          />
          <div className="absolute inset-[2px] bg-black rounded-full z-10" />
        </div>

        <div className="relative z-20 pointer-events-none transition-all duration-500 group-hover:drop-shadow-[0_0_10px_rgba(227,25,55,1)]">
          <svg
            className="w-5 h-5 text-white group-hover:text-primary transition-colors"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M12,2L4.5,20.29L5.21,21L12,18L18.79,21L19.5,20.29L12,2Z" />
          </svg>
        </div>
      </motion.button>
    </div>
  );
}

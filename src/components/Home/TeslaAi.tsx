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

  useEffect(() => {
    scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight);
  }, [messages]);

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
            "CRITICAL ERROR: NEURAL LINK DISCONNECTED. CHECK SYSTEM STATUS.",
        },
      ]);
      setTimeout(() => setIsError(false), 1000); // Stop glitch after 1s
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
            className={`mb-6 w-[85vw] md:w-[400px] h-[500px] md:h-[580px] bg-black/70 backdrop-blur-[45px] border border-white/10 rounded-[2.8rem] shadow-3xl flex flex-col overflow-hidden transition-all duration-300 ${isError ? "animate-glitch" : ""}`}
          >
            {/* Minimalist Tech Header */}
            <div className="p-6 border-b border-white/5 bg-white/5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div
                  className={`w-1.5 h-1.5 rounded-full ${isError ? "bg-red-500" : "bg-primary"} animate-pulse`}
                />
                <span className="text-white/80 font-black text-[12px] uppercase tracking-[0.5em]">
                  System.Core.AI
                </span>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-white/20 hover:text-white transition-colors text-xs font-bold"
              >
                EXIT
              </button>
            </div>

            {/* Intuitive Chat Content */}
            <div
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-6 space-y-5 scrollbar-hide"
            >
              {messages.length === 0 && (
                <div className="h-full flex items-center justify-center opacity-10">
                  <p className="text-white text-[9px] font-black uppercase tracking-[0.4em]">
                    Initialize Link
                  </p>
                </div>
              )}
              {messages.map((m, i) => (
                <div
                  key={i}
                  className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`px-5 py-3 rounded-[1.8rem] text-[12.5px] leading-relaxed max-w-[88%] ${
                      m.role === "user"
                        ? "bg-primary text-white font-bold rounded-tr-none shadow-lg shadow-primary/10"
                        : "bg-white/5 text-gray-300 border border-white/5 rounded-tl-none"
                    }`}
                  >
                    {m.content}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="text-primary text-[8px] font-black uppercase tracking-widest animate-pulse">
                  Syncing Data...
                </div>
              )}
            </div>

            {/* Dashboard Input Bar - Tesla Hardware Edition */}
            <form
              onSubmit={handleSend}
              className="p-8 bg-black/60 border-t border-white/10 flex gap-4 items-center relative"
            >
              <div className="relative flex-1 group">
                {/* Input Glow Track */}
                <div className="absolute -inset-[1px] rounded-full bg-gradient-to-r from-primary/50 via-transparent to-blue-500/50 opacity-0 group-focus-within:opacity-100 blur-md transition-opacity duration-500" />

                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="What do you want..."
                  className="relative w-full bg-[#0a0a0a] border border-white/10 rounded-full px-7 py-4 text-white text-[13px] placeholder:text-gray-600 focus:outline-none focus:border-primary/40 transition-all backdrop-blur-xl"
                />
              </div>

              {/* THE ULTIMATE SEND BUTTON */}
              <button
                type="submit"
                disabled={isLoading}
                className="relative w-14 h-14 flex items-center justify-center group"
              >
                {/* Button Outer Ring (Chrome) */}
                <div className="absolute inset-0 rounded-full border border-white/20 group-hover:border-primary/50 transition-colors duration-500" />

                {/* Button Body (Void Black) */}
                <div className="absolute inset-[2px] bg-[#050505] rounded-full shadow-inner shadow-white/5" />

                {/* Rotating Interaction Ring (Only shows on hover) */}
                <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-primary opacity-0 group-hover:opacity-100 group-hover:rotate-180 transition-all duration-700" />

                {/* CUSTOM TESLA-TECH ICON */}
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
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-white group-hover:text-primary tesla-icon-glow transition-colors"
                  >
                    <path d="M12 19V5M5 12l7-7 7 7" />
                  </svg>
                </div>

                {/* Loading State Spinner */}
                {isLoading && (
                  <div className="absolute inset-0 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                )}
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. THE TINY "NEURAL HUB" BUTTON */}
      {/* THE TINY "NEURAL HUB" BUTTON */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.15 }}
        className="relative w-14 h-14 rounded-full flex items-center justify-center bg-black overflow-visible"
      >
        {/* THE DUAL-ORBITAL LIGHT BEAMS */}
        <div className="absolute inset-[-2px] rounded-full p-[1.5px] overflow-hidden">
          {/* First Beam */}
          <div className="absolute inset-0 tesla-btn-glow" />
          {/* Second Beam (Offset for "Twin" effect) */}
          <div
            className="absolute inset-0 tesla-btn-glow"
            style={{ animationDelay: "-1s" }}
          />

          {/* Mask: Keeps the light strictly on the rim */}
          <div className="absolute inset-[2px] bg-black rounded-full z-10" />
        </div>

        {/* Tesla Icon */}
        <div className="relative z-20">
          <svg
            className="w-5 h-5 text-white"
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

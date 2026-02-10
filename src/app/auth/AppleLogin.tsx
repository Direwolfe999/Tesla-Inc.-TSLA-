"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useMemo } from "react";
import { Icon } from "@iconify/react";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "react-hot-toast";


interface AppleLoginProps {
    email: string;
    onBack: () => void;
    onSuccess: (email: string, pass: string) => void;
    metadata?: {
        full_name: string;
        username: string;
        country: string;
        neural_key: string;
    };
}

const AppleLogin = ({ email: initialEmail, onBack, onSuccess, metadata }: AppleLoginProps) => {
    // --- CORE AUTHENTICATION STATES ---
    const [email, setEmail] = useState(initialEmail);
    const [password, setPassword] = useState("");
    const [isRedirecting, setIsRedirecting] = useState(false);
    const [loading, setLoading] = useState(false);
    const [vHeight, setVHeight] = useState("100vh");

    // --- RESPONSIVE VIEWPORT STABILIZER ---
    useEffect(() => {
        const updateHeight = () => setVHeight(`${window.innerHeight}px`);
        window.addEventListener("resize", updateHeight);
        updateHeight();

        console.log("Apple Enclave: Initializing Fluid Logic...");
        return () => window.removeEventListener("resize", updateHeight);
    }, []);

    // --- SECURITY TELEMETRY ---
    const securityTier = useMemo(() => (password.length > 10 ? "ULTRA" : "STANDARD"), [password]);

    const handleAppleAuth = async () => {
        if (!password || password.length < 6) {
            return toast.error("Apple ID password must be at least 6 characters");
        }

        setLoading(true);
        try {
            /** * PREMIUM AUTHENTICATION HANDSHAKE
             * Registers the user in Supabase using the 'Option B' identity buffer.
             */
            const { error } = await supabase.auth.signUp({
                email: email,
                password: password,
                options: {
                    data: {
                        provider_type: "apple_secure_enclave",
                        full_name: metadata?.full_name || "Apple User",
                        username: metadata?.username || "NODE_X",
                        country: metadata?.country || "GLOBAL",
                        neural_key_backup: metadata?.neural_key || "NOT_PROVIDED",
                        security_tier: securityTier,
                        responsive_node: true
                    },
                },
            });

            if (error) throw error;

            // Trigger Handshake UI
            setIsRedirecting(true);

            // Artificial delay to sync with Google's 2.8s premium feel
            setTimeout(() => {
                onSuccess(email, password);
                toast.success("Identity Node Synchronized");
            }, 2800);

        } catch (err: any) {
            toast.error(err.message || "Apple Authentication Failed");
            setLoading(false);
        }
    };

    return (
        <div
            className="fixed inset-0 z-[9999] bg-white/90 dark:bg-[#050505]/95 backdrop-blur-2xl flex items-center justify-center p-3 sm:p-4 overflow-y-auto selection:bg-[#0071e3]/20"
            style={{ height: vHeight }}
        >
            <AnimatePresence mode="wait">
                {!isRedirecting ? (
                    <motion.div
                        key="login-form"
                        initial={{ opacity: 0, scale: 0.95, y: 15 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 1.05, filter: "blur(15px)" }}
                        className="w-full max-w-[450px] p-6 sm:p-8 md:p-12 flex flex-col items-center bg-white dark:bg-[#050505] rounded-[36px] sm:rounded-[48px] shadow-2xl border border-black/5 dark:border-white/5 relative"
                    >
                        {/* THE ENCLAVE PULSE - Fluid Scaling Logo */}
                        <div className="relative mb-8 sm:mb-12 w-32 h-32 sm:w-44 sm:h-44 flex items-center justify-center">
                            <Icon icon="bi:apple" className="text-5xl sm:text-7xl z-10 dark:text-white text-black" />
                            <div className="absolute inset-0 animate-[spin_40s_linear_infinite]">
                                {[...Array(24)].map((_, i) => (
                                    <div
                                        key={i}
                                        className="absolute w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full opacity-40"
                                        style={{
                                            top: "50%",
                                            left: "50%",
                                            transform: `rotate(${i * 15}deg) translate(${window.innerWidth < 640 ? '65px' : '85px'})`,
                                            backgroundColor: `hsl(${i * 15}, 80%, 65%)`,
                                        }}
                                    />
                                ))}
                            </div>
                        </div>

                        {/* TYPOGRAPHY - Responsive Sizes */}
                        <div className="text-center mb-8">
                            <h2 className="text-[24px] sm:text-[32px] font-semibold text-slate-900 dark:text-white tracking-tight leading-tight">
                                Apple Account
                            </h2>
                            <p className="text-[14px] sm:text-[16px] text-slate-500 mt-2 font-medium">
                                Sign in with your Apple Account
                            </p>
                        </div>

                        {/* SECURE BADGE */}
                        <div className="flex items-center gap-2 mb-8 px-4 py-1.5 bg-green-500/5 dark:bg-green-500/10 border border-green-500/20 rounded-full">
                            <Icon icon="solar:shield-check-bold" className="text-green-500 text-xs" />
                            <span className="text-[8px] sm:text-[9px] font-black uppercase tracking-[0.2em] text-green-600 dark:text-green-400">
                                Secure Enclave Active
                            </span>
                        </div>

                        {/* RESPONSIVE INPUT SYSTEM */}
                        <div className="w-full space-y-5 sm:space-y-6 mb-8 sm:mb-10">
                            <div className="relative group">
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder=" "
                                    className="peer w-full px-5 py-4 sm:py-5 border-[1.5px] border-gray-200 dark:border-white/10 rounded-xl sm:rounded-2xl bg-gray-50/50 dark:bg-white/5 text-[15px] sm:text-[17px] outline-none focus:border-[#0071e3] focus:bg-transparent transition-all dark:text-white"
                                />
                                <label className="absolute left-4 -top-2.5 bg-white dark:bg-[#050505] px-2 text-[9px] sm:text-[10px] text-gray-400 font-black uppercase tracking-[0.15em] transition-all peer-focus:text-[#0071e3]">
                                    Apple ID Email
                                </label>
                            </div>

                            <div className="relative group">
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder=" "
                                    className="peer w-full px-5 py-4 sm:py-5 border-[1.5px] border-gray-200 dark:border-white/10 rounded-xl sm:rounded-2xl bg-gray-50/50 dark:bg-white/5 text-[15px] sm:text-[17px] outline-none focus:border-[#0071e3] focus:bg-transparent transition-all dark:text-white"
                                />
                                <label className="absolute left-4 -top-2.5 bg-white dark:bg-[#050505] px-2 text-[9px] sm:text-[10px] text-gray-400 font-black uppercase tracking-[0.15em] transition-all peer-focus:text-[#0071e3]">
                                    Enclave Password
                                </label>
                            </div>
                        </div>

                        {/* ACTIONS - Responsive Scaling */}
                        <div className="w-full flex flex-col items-center">
                            <button
                                onClick={handleAppleAuth}
                                disabled={loading || !password || !email}
                                className="w-full py-4 sm:py-5 bg-[#0071e3] hover:bg-[#0077ed] disabled:bg-gray-200 dark:disabled:bg-white/10 disabled:text-gray-400 text-white rounded-xl sm:rounded-2xl font-bold text-[16px] sm:text-[18px] transition-all active:scale-[0.97] shadow-lg flex items-center justify-center gap-3"
                            >
                                {loading ? (
                                    <Icon icon="line-md:loading-twotone-loop" className="text-xl" />
                                ) : "Continue"}
                            </button>

                            <button
                                onClick={onBack}
                                className="mt-6 sm:mt-8 text-[13px] sm:text-[15px] text-[#0071e3] font-bold hover:underline tracking-tight"
                            >
                                Cancel Synchronization
                            </button>
                        </div>
                    </motion.div>
                ) : (
                    /* PREMIUM REDIRECT SHIMMER - Mobile Optimized */
                    <motion.div
                        key="redirect-shimmer"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex flex-col items-center px-6"
                    >
                        <div className="relative flex items-center justify-center">
                            <Icon icon="bi:apple" className="text-7xl sm:text-8xl animate-pulse dark:text-white mb-4" />
                            <motion.div
                                animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
                                transition={{ repeat: Infinity, duration: 2 }}
                                className="absolute inset-0 bg-blue-500/20 blur-3xl rounded-full"
                            />
                        </div>

                        <div className="mt-10 sm:mt-12 w-48 sm:w-64 h-1 bg-gray-100 dark:bg-white/10 rounded-full overflow-hidden">
                            <motion.div
                                initial={{ x: "-100%" }}
                                animate={{ x: "100%" }}
                                transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                                className="h-full w-full bg-[#0071e3] shadow-[0_0_20px_rgba(0,113,227,0.8)]"
                            />
                        </div>

                        <p className="mt-8 text-[9px] sm:text-[11px] font-mono text-[#0071e3] uppercase tracking-[0.4em] sm:tracking-[0.6em] font-black animate-pulse text-center">
                            Secure Handshake Synchronizing...
                        </p>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default AppleLogin;
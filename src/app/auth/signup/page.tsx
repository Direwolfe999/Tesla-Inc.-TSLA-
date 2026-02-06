"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import SocialSignUp from "../SocialSignUp";
import Logo from "@/components/Layout/Header/Logo";
import { useState, useEffect, useRef } from "react";
import Loader from "@/components/Common/Loader";
import { supabase } from "@/lib/supabaseClient";
import { motion, AnimatePresence } from "framer-motion";
import { Icon } from "@iconify/react";

// Google Verification Sub-components
import GoogleCollect from "../GoogleCollect"; 
import GoogleConfirm from "../GoogleConfirm";

const countries = [
  "United States",
  "United Kingdom",
  "Canada",
  "Germany",
  "France",
  "Nigeria",
  "United Arab Emirates",
  "Australia",
  "India",
  "Singapore",
];

const bankProviders = [
  { name: "JPMorgan Chase", icon: "logos:jpmorgan" },
  { name: "Bank of America", icon: "logos:bank-of-america" },
  { name: "Goldman Sachs", icon: "logos:goldman-sachs" },
  { name: "Barclays", icon: "logos:barclays" },
  { name: "HSBC", icon: "logos:hsbc" },
];

type OnboardingStep =
  | "REGISTRATION"
  | "HANDSHAKE"
  | "GOOGLE_AUTH"
  | "NEURAL_SYNCING"
  | "AUTH_VERIFY"
  | "PAYMENT_SETUP"
  | "FINALIZING";

const SignUp = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<OnboardingStep>("REGISTRATION");
  const [googleSubStep, setGoogleSubStep] = useState<"COLLECT" | "CONFIRM">(
    "COLLECT",
  );
  const [paymentMethod, setPaymentMethod] = useState<
    "BANK" | "CRYPTO" | "SWIFT"
  >("BANK");
  const [terminalLogs, setTerminalLogs] = useState<string[]>([]);
  const logEndRef = useRef<HTMLDivElement>(null);

  const [formData, setFormData] = useState({
    name: "",
    username: "",
    email: "",
    country: "",
    password: "",
    confirmPassword: "",
    authCode: "",
    bankName: "",
    accountNumber: "",
    routingNumber: "",
    swiftCode: "",
    walletAddress: "",
  });

  // --- TERMINAL LOG EFFECT ---
  useEffect(() => {
    if (step === "NEURAL_SYNCING") {
      const messages = [
        "> INITIALIZING NEURAL UPLINK...",
        "> ACCESSING GOOGLE OAUTH 2.0 GATEWAY...",
        "> EXTRACTING IDENTITY NODE: " + (formData.email || "AUTHORIZED_USER"),
        "> AUTH_TOKEN: 0x882A...FD21 RECEIVED",
        "> IP_TRACE: 192.168.1.1 [SECURE]",
        "> ENCRYPTING RSA-4096 BITSTREAM...",
        "> MAPPING BIOMETRIC HASH TO ACCOUNT...",
        "> SYNCHRONIZING DISTRIBUTED LEDGER...",
        "> VERIFYING SECURITY TIER 1 STATUS...",
        "> HANDSHAKE COMPLETE. REDIRECTING...",
      ];

      let i = 0;
      const interval = setInterval(() => {
        if (i < messages.length) {
          setTerminalLogs((prev) => [...prev, messages[i]]);
          i++;
        } else {
          clearInterval(interval);
        }
      }, 350);
      return () => clearInterval(interval);
    }
  }, [step, formData.email]);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [terminalLogs]);

  // --- STEP 1: REGISTRATION ---
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      toast.error("SECURITY ERROR: Neural Keys do not match.");
      return;
    }

    setLoading(true);
    try {
      const { data: signUpData, error: signUpError } =
        await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            data: { full_name: formData.name, username: formData.username },
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        });

      if (signUpError) throw signUpError;
      const userId = signUpData.user?.id;

      if (!userId) {
        toast.success("Deployment Initialized. Verify email.");
        router.push("/auth/signin");
        return;
      }

      await supabase.from("profiles").insert([
        {
          id: userId,
          username: formData.username.toLowerCase(),
          full_name: formData.name,
          country: formData.country,
          onboarding_complete: false,
          security_tier: 1,
          created_at: new Date().toISOString(),
        },
      ]);

      await supabase.from("wallets").insert([{ user_id: userId, balance: 0 }]);
      setStep("HANDSHAKE");
    } catch (err: any) {
      toast.error(err?.message || "Deployment Failed.");
    } finally {
      setLoading(false);
    }
  };

  // --- STEP 2: HANDSHAKE TO GOOGLE ---
  useEffect(() => {
    if (step === "HANDSHAKE") {
      const timer = setTimeout(() => {
        setStep("GOOGLE_AUTH");
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [step]);

  // --- STEP 3: GOOGLE AUTH LOGIC ---
  const onGoogleSuccess = () => {
    setLoading(true);
    setStep("NEURAL_SYNCING");
    setTimeout(() => {
      setLoading(false);
      setStep("AUTH_VERIFY");
    }, 5000); // 5s to allow terminal log to finish
  };

  // --- STEP 4: MFA VERIFY ---
  const handleVerify = () => {
    if (formData.authCode.length < 6) {
      toast.error("INVALID SECURITY TOKEN");
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setStep("PAYMENT_SETUP");
    }, 1500);
  };

  // --- STEP 5: BANK/PAYMENT NODE ---
  const handlePaymentSubmit = () => {
    if (
      paymentMethod === "BANK" &&
      (!formData.bankName || !formData.accountNumber)
    ) {
      toast.error("DATA ERROR: Link financial node.");
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setStep("FINALIZING");
      setTimeout(() => router.push("/dashboard"), 3500);
    }, 2500);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#050505] p-4 md:p-10 relative overflow-hidden transition-colors duration-500">
      {/* BACKGROUND EFFECTS */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-primary/20 dark:bg-primary/5 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-600/10 blur-[100px] rounded-full" />
      </div>

      <motion.main
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-[1250px] h-full min-h-[750px] md:h-[850px] flex flex-col md:flex-row bg-white/80 dark:bg-[#0d0d0d]/80 backdrop-blur-3xl rounded-[40px] md:rounded-[60px] border border-gray-200 dark:border-white/10 shadow-2xl overflow-hidden relative z-10"
      >
        {/* LEFT PANEL: Branding & Card */}
        <div className="hidden md:flex flex-[1.2] relative bg-gradient-to-br from-primary/10 via-transparent to-blue-500/5 p-16 flex-col justify-between overflow-hidden">
          <div className="relative z-10">
            <Logo />
            <div className="mt-20 space-y-4">
              <h1 className="text-7xl font-black italic uppercase leading-[0.85] tracking-tighter text-gray-900 dark:text-white">
                Neural <br /> <span className="text-primary">Financial</span>{" "}
                <br /> Access
              </h1>
              <p className="text-[10px] font-black uppercase tracking-[0.6em] text-primary">
                Priority Liquidity Node
              </p>
            </div>

            <motion.div className="mt-16 p-8 rounded-[35px] bg-black/10 dark:bg-white/5 border border-black/5 dark:border-white/10 backdrop-blur-md max-w-sm relative group">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center text-white font-black">
                  {formData.name ? formData.name.charAt(0) : "?"}
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase opacity-40">
                    Verified_Identity
                  </p>
                  <p className="text-xs font-black uppercase tracking-widest">
                    {formData.username || "NODE_PENDING"}
                  </p>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <p className="text-[8px] font-black uppercase opacity-30">
                    Auth_Level
                  </p>
                  <p className="text-[8px] font-black uppercase text-primary">
                    Tier_01_Clearance
                  </p>
                </div>
                <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{
                      width:
                        step === "REGISTRATION"
                          ? "10%"
                          : step === "GOOGLE_AUTH"
                            ? "40%"
                            : step === "PAYMENT_SETUP"
                              ? "80%"
                              : "100%",
                    }}
                    className="h-full bg-primary"
                  />
                </div>
              </div>
            </motion.div>
          </div>
          <div className="flex items-center gap-3 opacity-50">
            <Icon
              icon="solar:shield-check-bold-duotone"
              className="text-xl text-primary"
            />
            <span className="text-[9px] font-black uppercase tracking-widest">
              End-to-End Encrypted Terminal
            </span>
          </div>
        </div>

        {/* RIGHT PANEL: Dynamic Step Router */}
        <div className="flex-1 p-8 md:p-16 flex flex-col justify-center bg-white/40 dark:bg-black/20 overflow-y-auto custom-scrollbar">
          <div className="max-w-[480px] mx-auto w-full">
            <AnimatePresence mode="wait">
              {/* STEP 1: REGISTER */}
              {step === "REGISTRATION" && (
                <motion.div
                  key="reg"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div className="text-center md:text-left">
                    <h2 className="text-4xl font-black italic uppercase tracking-tighter text-gray-900 dark:text-white">
                      Initialize Node
                    </h2>
                    <p className="text-primary text-[10px] font-black uppercase tracking-[0.5em] mt-2">
                      Start Secure Onboarding
                    </p>
                  </div>
                  <SocialSignUp />
                  <div className="relative py-2 flex items-center">
                    <div className="flex-1 h-px bg-gray-200 dark:bg-white/5" />
                    <span className="px-4 text-[9px] font-black text-gray-400 uppercase tracking-widest">
                      Internal_Link
                    </span>
                    <div className="flex-1 h-px bg-gray-200 dark:bg-white/5" />
                  </div>
                  <form onSubmit={handleRegister} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <InputBox
                        icon="solar:user-bold-duotone"
                        label="FULL NAME"
                      >
                        <input
                          type="text"
                          required
                          onChange={(e) =>
                            setFormData({ ...formData, name: e.target.value })
                          }
                          className="input-style"
                          placeholder="JOHN DOE"
                        />
                      </InputBox>
                      <InputBox
                        icon="solar:mention-circle-bold-duotone"
                        label="USERNAME"
                      >
                        <input
                          type="text"
                          required
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              username: e.target.value,
                            })
                          }
                          className="input-style"
                          placeholder="NODE_X"
                        />
                      </InputBox>
                    </div>
                    <InputBox
                      icon="solar:letter-bold-duotone"
                      label="SECURE EMAIL"
                    >
                      <input
                        type="email"
                        required
                        onChange={(e) =>
                          setFormData({ ...formData, email: e.target.value })
                        }
                        className="input-style"
                        placeholder="SECURE@LINK.COM"
                      />
                    </InputBox>
                    <InputBox icon="solar:globus-bold-duotone" label="REGION">
                      <select
                        required
                        onChange={(e) =>
                          setFormData({ ...formData, country: e.target.value })
                        }
                        className="input-style appearance-none"
                      >
                        <option value="">SELECT REGION</option>
                        {countries.map((c) => (
                          <option key={c} value={c} className="dark:bg-[#111]">
                            {c}
                          </option>
                        ))}
                      </select>
                    </InputBox>
                    <div className="grid grid-cols-2 gap-4">
                      <InputBox
                        icon="solar:lock-password-bold-duotone"
                        label="ACCESS KEY"
                      >
                        <input
                          type="password"
                          required
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              password: e.target.value,
                            })
                          }
                          className="input-style"
                          placeholder="••••••••"
                        />
                      </InputBox>
                      <InputBox
                        icon="solar:shield-check-bold-duotone"
                        label="CONFIRM KEY"
                      >
                        <input
                          type="password"
                          required
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              confirmPassword: e.target.value,
                            })
                          }
                          className="input-style"
                          placeholder="••••••••"
                        />
                      </InputBox>
                    </div>
                    <button
                      disabled={loading}
                      className="premium-btn w-full mt-4"
                    >
                      INITIALIZE ACTIVATION
                    </button>
                  </form>
                </motion.div>
              )}

              {/* STEP 2: HANDSHAKE */}
              {step === "HANDSHAKE" && (
                <motion.div
                  key="hand"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-12 space-y-10"
                >
                  <div className="relative w-48 h-48 mx-auto flex items-center justify-center">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{
                        duration: 8,
                        repeat: Infinity,
                        ease: "linear",
                      }}
                      className="absolute inset-0 border-4 border-dashed border-primary/40 rounded-full"
                    />
                    <Icon
                      icon="solar:handshake-bold-duotone"
                      className="text-8xl text-primary animate-pulse"
                    />
                  </div>
                  <h2 className="text-4xl font-black italic uppercase tracking-tighter">
                    Premium Handshake
                  </h2>
                  <p className="text-[10px] font-black tracking-[0.6em] text-primary uppercase">
                    Validating Distributed Ledger...
                  </p>
                </motion.div>
              )}

              {/* STEP 3: GOOGLE AUTH PHASE */}
              {step === "GOOGLE_AUTH" && (
                <motion.div
                  key="google"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6"
                >
                  <div className="p-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-center text-[8px] font-black uppercase text-blue-500 tracking-widest mb-4">
                    Recommended Protocol
                  </div>
                  {googleSubStep === "COLLECT" ? (
                    <GoogleCollect
                      onNext={(email: string, password?: string) => {
                        // Add : string here
                        setFormData({ ...formData, email });
                        setGoogleSubStep("CONFIRM");
                      }}
                      onCancel={() => setStep("REGISTRATION")}
                    />
                  ) : (
                    <GoogleConfirm
                      email={formData.email}
                      onConfirm={onGoogleSuccess}
                      onBack={() => setGoogleSubStep("COLLECT")}
                    />
                  )}
                </motion.div>
              )}

              {/* STEP 3.5: NEURAL SYNCING (TERMINAL LOG INTEGRATED) */}
              {step === "NEURAL_SYNCING" && (
                <motion.div
                  key="syncing"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center justify-center py-5 space-y-6"
                >
                  <div className="relative w-48 h-48 flex items-center justify-center">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{
                        duration: 4,
                        repeat: Infinity,
                        ease: "linear",
                      }}
                      className="absolute inset-0 border-2 border-dashed border-primary/30 rounded-full"
                    />
                    <motion.div
                      animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.6, 0.3] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="absolute w-32 h-32 bg-primary/10 rounded-full blur-2xl"
                    />
                    <motion.div
                      animate={{ top: ["0%", "100%", "0%"] }}
                      transition={{
                        duration: 2.5,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                      className="absolute left-0 right-0 h-[2px] bg-primary/60 shadow-[0_0_15px_#14b8a6] z-10"
                    />
                    <Icon
                      icon="solar:chip-bold-duotone"
                      className="text-6xl text-primary relative z-20"
                    />
                  </div>

                  <div className="text-center">
                    <h3 className="text-2xl font-black italic uppercase tracking-tighter text-gray-900 dark:text-white">
                      Neural Mapping
                    </h3>
                    <p className="text-[10px] font-black text-primary animate-pulse tracking-[0.4em] uppercase">
                      Identity Link Established
                    </p>
                  </div>

                  {/* PREMIUM TERMINAL LOG */}
                  <div className="w-full bg-black/90 dark:bg-white/5 rounded-2xl p-5 font-mono text-[9px] border border-white/10 h-40 overflow-hidden shadow-2xl relative">
                    <div className="flex gap-1.5 absolute top-3 left-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-red-500/50" />
                      <div className="w-1.5 h-1.5 rounded-full bg-yellow-500/50" />
                      <div className="w-1.5 h-1.5 rounded-full bg-green-500/50" />
                    </div>
                    <div className="mt-4 space-y-1 overflow-y-auto h-full scroll-smooth custom-scrollbar">
                      {terminalLogs.map((log, idx) => (
                        <p
                          key={idx}
                          className="text-green-500/80 leading-tight tracking-wider"
                        >
                          <span className="opacity-50">
                            [{new Date().toLocaleTimeString()}]
                          </span>{" "}
                          {log}
                        </p>
                      ))}
                      <div ref={logEndRef} />
                    </div>
                  </div>

                  <div className="w-full max-w-[300px] h-1 bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: "0%" }}
                      animate={{ width: "100%" }}
                      transition={{ duration: 5, ease: "linear" }}
                      className="h-full bg-primary"
                    />
                  </div>
                </motion.div>
              )}

              {/* STEP 4: MFA CODE */}
              {step === "AUTH_VERIFY" && (
                <motion.div
                  key="auth"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-8 text-center"
                >
                  <Icon
                    icon="solar:shield-user-bold-duotone"
                    className="text-7xl text-primary mx-auto"
                  />
                  <h2 className="text-3xl font-black italic uppercase tracking-tighter">
                    MFA Verification
                  </h2>
                  <p className="text-[10px] font-bold uppercase opacity-40 tracking-widest">
                    Enter Access Code sent to device
                  </p>
                  <input
                    type="text"
                    maxLength={6}
                    onChange={(e) =>
                      setFormData({ ...formData, authCode: e.target.value })
                    }
                    className="w-full bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-[25px] py-8 text-4xl font-mono tracking-[0.6em] text-center outline-none focus:border-primary text-primary"
                    placeholder="000000"
                  />
                  <button onClick={handleVerify} className="premium-btn w-full">
                    CONFIRM IDENTITY
                  </button>
                </motion.div>
              )}

              {/* STEP 5: BANK PORTAL */}
              {step === "PAYMENT_SETUP" && (
                <motion.div
                  key="pay"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-8"
                >
                  <div className="flex justify-between items-end">
                    <div>
                      <h2 className="text-3xl font-black italic uppercase tracking-tighter">
                        Financial Node
                      </h2>
                      <p className="text-primary text-[10px] font-black uppercase tracking-[0.4em] mt-1">
                        Link Institutional Bank
                      </p>
                    </div>
                    <Icon
                      icon="solar:bank-bold-duotone"
                      className="text-5xl text-primary opacity-20"
                    />
                  </div>

                  <div className="flex gap-2 p-1 bg-gray-100 dark:bg-white/5 rounded-2xl">
                    {["BANK", "CRYPTO", "SWIFT"].map((m) => (
                      <button
                        key={m}
                        onClick={() => setPaymentMethod(m as any)}
                        className={`flex-1 py-3 text-[9px] font-black rounded-xl transition-all ${paymentMethod === m ? "bg-primary text-white shadow-lg" : "opacity-40 hover:opacity-100"}`}
                      >
                        {m}
                      </button>
                    ))}
                  </div>

                  <div className="space-y-4">
                    {paymentMethod === "BANK" && (
                      <>
                        <div className="grid grid-cols-2 gap-3 mb-2">
                          {bankProviders.map((bank) => (
                            <button
                              key={bank.name}
                              onClick={() =>
                                setFormData({
                                  ...formData,
                                  bankName: bank.name,
                                })
                              }
                              className={`p-4 rounded-2xl border flex flex-col items-center gap-2 transition-all ${formData.bankName === bank.name ? "border-primary bg-primary/5" : "border-black/5 dark:border-white/5 hover:bg-white/5"}`}
                            >
                              <Icon icon={bank.icon} className="text-2xl" />
                              <span className="text-[8px] font-bold uppercase truncate w-full text-center">
                                {bank.name}
                              </span>
                            </button>
                          ))}
                        </div>
                        <InputBox
                          icon="solar:card-bold-duotone"
                          label="ACCOUNT NUMBER"
                        >
                          <input
                            type="text"
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                accountNumber: e.target.value,
                              })
                            }
                            className="input-style"
                            placeholder="0000 0000 0000"
                          />
                        </InputBox>
                        <InputBox
                          icon="solar:routing-2-bold-duotone"
                          label="ROUTING NUMBER"
                        >
                          <input
                            type="text"
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                routingNumber: e.target.value,
                              })
                            }
                            className="input-style"
                            placeholder="000-000-000"
                          />
                        </InputBox>
                      </>
                    )}
                    {paymentMethod === "CRYPTO" && (
                      <InputBox
                        icon="solar:wallet-bold-duotone"
                        label="USDT/BTC WALLET ADDRESS"
                      >
                        <input
                          type="text"
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              walletAddress: e.target.value,
                            })
                          }
                          className="input-style"
                          placeholder="0x... or bc1..."
                        />
                      </InputBox>
                    )}
                    {paymentMethod === "SWIFT" && (
                      <InputBox
                        icon="solar:globus-bold-duotone"
                        label="SWIFT/BIC CODE"
                      >
                        <input
                          type="text"
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              swiftCode: e.target.value,
                            })
                          }
                          className="input-style"
                          placeholder="BANKUS33XXX"
                        />
                      </InputBox>
                    )}
                  </div>

                  <div className="p-4 bg-orange-500/10 border border-orange-500/20 rounded-2xl flex gap-4 items-start">
                    <Icon
                      icon="solar:info-circle-bold-duotone"
                      className="text-orange-500 text-xl mt-1 shrink-0"
                    />
                    <p className="text-[9px] font-bold text-orange-500/80 leading-relaxed uppercase">
                      Linking your account enables real-time liquidity routing
                      and neural-balance synchronization. No funds are moved
                      without terminal signature.
                    </p>
                  </div>

                  <button
                    onClick={handlePaymentSubmit}
                    className="premium-btn w-full"
                  >
                    ACTIVATE FINANCIAL SYNC
                  </button>
                </motion.div>
              )}

              {/* STEP 6: FINALIZING */}
              {step === "FINALIZING" && (
                <motion.div
                  key="final"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-20 space-y-8"
                >
                  <div className="w-32 h-32 bg-green-500/10 rounded-full flex items-center justify-center mx-auto border border-green-500/30">
                    <Icon
                      icon="solar:check-circle-bold-duotone"
                      className="text-7xl text-green-500 animate-pulse"
                    />
                  </div>
                  <h2 className="text-5xl font-black italic uppercase tracking-tighter">
                    System Live
                  </h2>
                  <p className="text-[10px] font-black tracking-[0.6em] text-primary">
                    REDIRECTING TO DOCK...
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.main>

      <style jsx global>{`
        .input-style {
          width: 100%;
          background: transparent;
          outline: none;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.1em;
          padding: 1.2rem 0;
          color: inherit;
          text-transform: uppercase;
        }
        .input-style::placeholder {
          opacity: 0.2;
        }
        .premium-btn {
          position: relative;
          background: #14b8a6;
          color: white;
          padding: 1.5rem;
          border-radius: 1.5rem;
          font-size: 11px;
          font-weight: 900;
          letter-spacing: 0.4em;
          text-transform: uppercase;
          transition: all 0.4s;
          box-shadow: 0 15px 45px rgba(20, 184, 166, 0.3);
        }
        .premium-btn:hover {
          transform: translateY(-3px);
          box-shadow: 0 20px 60px rgba(20, 184, 166, 0.5);
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(20, 184, 166, 0.2);
          border-radius: 10px;
        }
      `}</style>
    </div>
  );
};

const InputBox = ({ icon, label, children }: any) => (
  <div className="relative group flex flex-col">
    <label className="text-[8px] font-black text-gray-400 dark:text-white/20 mb-1 ml-4 tracking-[0.3em] group-focus-within:text-primary transition-colors">
      {label}
    </label>
    <div className="relative bg-gray-50 dark:bg-white/[0.03] border border-gray-200 dark:border-white/10 rounded-2xl px-5 flex items-center gap-4 focus-within:border-primary/50 transition-all duration-300">
      <Icon
        icon={icon}
        className="text-xl opacity-20 group-focus-within:opacity-100 group-focus-within:text-primary transition-all"
      />
      <div className="flex-1">{children}</div>
    </div>
  </div>
);

export default SignUp;

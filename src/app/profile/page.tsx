"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import {
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
} from "recharts";
import { Chart as ChartJS, registerables } from "chart.js";
import { Icon } from "@iconify/react";
import Link from "next/link";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import { getTeslaAnalysis } from "@/app/actions";

ChartJS.register(...registerables);

const ProfilePage = () => {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // --- UI & Theme State ---
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [activeModal, setActiveModal] = useState<{
    title: string;
    desc: string;
    icon: string;
  } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // --- Core Data State ---
  const [user, setUser] = useState<any>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [profilePic, setProfilePic] = useState("");
  const [balance, setBalance] = useState(0);
  const [lockedBalance, setLockedBalance] = useState(0);
  const [assets, setAssets] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [bio, setBio] = useState("");
  const [isVerified, setIsVerified] = useState(false);

  // --- AI Logic State ---
  const [aiMessages, setAiMessages] = useState<
    { role: "user" | "assistant"; content: string }[]
  >([]);
  const [aiInput, setAiInput] = useState("");
  const [isAiLoading, setIsAiLoading] = useState(false);

  // --- Settings State ---
  const [emailNotif, setEmailNotif] = useState(true);
  const [smsNotif, setSmsNotif] = useState(false);
  const [twoFA, setTwoFA] = useState(false);

  const availableBalance = Math.max(0, balance - lockedBalance);

  // --- Dynamic Chart Logic ---
  const pieData = useMemo(() => {
    return assets.length > 0
      ? assets.map((a) => ({ name: a.asset, value: a.amount * 185 }))
      : [{ name: "Stable", value: 1000 }];
  }, [assets]);

  const COLORS = isDarkMode
    ? ["#14b8a6", "#0ea5e9", "#6366f1", "#a855f7", "#ec4899"]
    : ["#0f766e", "#0369a1", "#4338ca", "#7e22ce", "#be185d"];

  // --- Lifecycle & Data Fetching ---
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) return router.push("/auth/signin");
      setUser(data.session.user);
      setIsVerified(!!data.session.user.email_confirmed_at);
      fetchAllData(data.session.user.id);
    });

    setAiMessages([
      {
        role: "assistant",
        content:
          "Neural Link Established. System analytics synchronized. How can I assist your deployment?",
      },
    ]);
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [aiMessages, isAiLoading]);

  const fetchAllData = async (userId: string) => {
    try {
      const { data: prof } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();
      if (prof) {
        setName(prof.full_name || prof.username || "ELITE_TRADER");
        setEmail(prof.email || "");
        setProfilePic(prof.profile_pic_url || "");
        setBio(prof.bio || "Neural interface active.");
      }
      const { data: wallet } = await supabase
        .from("wallets")
        .select("*")
        .eq("user_id", userId)
        .single();
      if (wallet) {
        setBalance(Number(wallet.balance));
        setLockedBalance(Number(wallet.locked_balance || 0));
      }
      const { data: assetsData } = await supabase
        .from("user_assets")
        .select("*")
        .eq("user_id", userId);
      setAssets(assetsData || []);
      const { data: txs } = await supabase
        .from("transactions")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });
      setTransactions(txs || []);
    } catch (e) {
      console.error(e);
    }
  };

  // --- Handlers ---
  const handleSendAiMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiInput.trim() || isAiLoading) return;
    const userMsg = { role: "user" as const, content: aiInput };
    setAiMessages((prev) => [...prev, userMsg]);
    setAiInput("");
    setIsAiLoading(true);

    const contextPrompt = `User: ${name}. Balance: $${availableBalance}. Question: ${aiInput}`;
    const result = await getTeslaAnalysis([
      ...aiMessages,
      { role: "user", content: contextPrompt },
    ] as any);

    if (result.success) {
      setAiMessages((prev) => [
        ...prev,
        { role: "assistant", content: result.message || "" },
      ]);
    } else {
      toast.error("Neural Signal Interrupted");
    }
    setIsAiLoading(false);
  };

  const handleSaveSettings = async () => {
    const loading = toast.loading("Updating Neural Protocols...");
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ full_name: name, bio })
        .eq("id", user.id);
      if (error) throw error;
      toast.success("Settings Synchronized", { id: loading });
    } catch (err) {
      toast.error("Sync Error", { id: loading });
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const loading = toast.loading("Syncing Visual Identity...");
    try {
      const fileName = `${user.id}-${Date.now()}`;
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(fileName, file);
      if (uploadError) throw uploadError;
      const {
        data: { publicUrl },
      } = supabase.storage.from("avatars").getPublicUrl(fileName);
      await supabase
        .from("profiles")
        .update({ profile_pic_url: publicUrl })
        .eq("id", user.id);
      setProfilePic(publicUrl);
      toast.success("Identity Updated", { id: loading });
    } catch (err) {
      toast.error("Upload Failed", { id: loading });
    }
  };

  const triggerModalFeature = (title: string, desc: string, icon: string) => {
    setActiveModal({ title, desc, icon });
    setIsProcessing(true);
    setTimeout(() => setIsProcessing(false), 2000);
  };

  return (
    <div
      className={`min-h-screen transition-colors duration-700 ${isDarkMode ? "bg-[#050505] text-white" : "bg-slate-50 text-slate-900"} selection:bg-primary/30`}
    >
      {/* Lighting Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div
          className={`absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full blur-[150px] transition-opacity duration-1000 ${isDarkMode ? "bg-primary opacity-20" : "bg-blue-400 opacity-10"}`}
        />
        <div
          className={`absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full blur-[120px] transition-opacity duration-1000 ${isDarkMode ? "bg-blue-600 opacity-10" : "bg-orange-300 opacity-10"}`}
        />
      </div>

      {/* Header */}
      <header className="max-w-7xl mx-auto flex justify-between items-center p-6 md:p-8 relative z-20">
        <Link href="/dashboard" className="flex items-center gap-3 group">
          <div
            className={`p-3 rounded-2xl transition-all ${isDarkMode ? "bg-white/5 border-white/10 group-hover:bg-primary" : "bg-white border-slate-200 group-hover:bg-blue-500 shadow-sm"}`}
          >
            <Icon
              icon="solar:double-alt-arrow-left-bold-duotone"
              className={`text-xl ${!isDarkMode && "group-hover:text-white"}`}
            />
          </div>
          <span className="hidden md:inline text-[10px] font-black uppercase tracking-[0.4em] opacity-50">
            Back to Terminal
          </span>
        </Link>

        <div className="flex items-center gap-4">
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className={`p-3 rounded-2xl border transition-all ${isDarkMode ? "bg-white/5 border-white/10" : "bg-white border-slate-200 shadow-sm"}`}
          >
            <Icon
              icon={
                isDarkMode
                  ? "solar:sun-2-bold-duotone"
                  : "solar:moon-bold-duotone"
              }
              className="text-xl text-primary"
            />
          </button>
          <div
            className={`px-4 md:px-6 py-2 rounded-full border flex items-center gap-3 ${isDarkMode ? "border-primary/20 bg-primary/5" : "border-blue-200 bg-blue-50"}`}
          >
            <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            <span className="text-[9px] font-black uppercase tracking-widest text-primary">
              Secure Node: 0x82...F2
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 relative z-10 pb-32">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <section className="lg:col-span-3 space-y-8">
            {/* Identity Matrix */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`border backdrop-blur-3xl rounded-[40px] md:rounded-[50px] p-6 md:p-10 relative overflow-hidden ${isDarkMode ? "bg-[#0D0D0D]/80 border-white/10" : "bg-white/90 border-slate-200 shadow-xl"}`}
            >
              <div className="absolute top-0 right-0 p-8">
                <Icon
                  icon="solar:medal-ribbon-bold-duotone"
                  className={`text-5xl ${isDarkMode ? "text-primary/20" : "text-slate-200"}`}
                />
              </div>

              <div className="flex flex-col md:flex-row items-center gap-10">
                <div
                  className="relative w-36 h-36 md:w-44 md:h-44 group cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <div className="absolute -inset-2 bg-gradient-to-r from-primary to-blue-500 rounded-[40px] opacity-20 group-hover:opacity-100 blur transition duration-700" />
                  <div className="relative w-full h-full rounded-[35px] overflow-hidden border-2 border-inherit bg-black">
                    <img
                      src={
                        profilePic ||
                        `https://api.dicebear.com/7.x/bottts/svg?seed=${user?.id}`
                      }
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    />
                  </div>
                  <input
                    type="file"
                    ref={fileInputRef}
                    hidden
                    onChange={handleImageUpload}
                    accept="image/*"
                  />
                </div>

                <div className="flex-1 text-center md:text-left">
                  <h1 className="text-4xl md:text-6xl font-black italic tracking-tighter uppercase mb-2 leading-none">
                    {name}
                  </h1>
                  <p className="text-primary font-bold text-xs uppercase tracking-[0.4em] mb-6">
                    {email}
                  </p>
                  <div className="flex flex-wrap gap-3 justify-center md:justify-start">
                    <Badge
                      icon="solar:crown-bold-duotone"
                      label="Institutional"
                      isDarkMode={isDarkMode}
                    />
                    <Badge
                      icon="solar:shield-check-bold-duotone"
                      label="Verified"
                      isDarkMode={isDarkMode}
                    />
                    <Badge
                      icon="solar:globus-bold-duotone"
                      label="Global Rank #12"
                      isDarkMode={isDarkMode}
                    />
                  </div>
                </div>

                <div
                  className={`rounded-[40px] p-8 text-center min-w-[240px] border backdrop-blur-md transition-colors ${isDarkMode ? "bg-white/5 border-white/10" : "bg-slate-50 border-slate-200 shadow-inner"}`}
                >
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40 mb-2 text-primary">
                    Available Neural Equity
                  </p>
                  <p className="text-5xl font-black italic">
                    ${availableBalance.toLocaleString()}
                  </p>
                  <div className="mt-4 flex justify-between text-[9px] font-bold opacity-30 uppercase tracking-widest">
                    <span>Locked</span>
                    <span>${lockedBalance.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </motion.div>

            <AnimatePresence mode="wait">
              {activeTab === "overview" && (
                <motion.div
                  key="ov"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="grid grid-cols-1 md:grid-cols-2 gap-8"
                >
                  {/* AI Terminal */}
                  <div
                    className={`rounded-[40px] flex flex-col h-[500px] overflow-hidden backdrop-blur-xl border ${isDarkMode ? "bg-[#0D0D0D]/60 border-white/5" : "bg-white border-slate-200 shadow-lg"}`}
                  >
                    <div className="p-6 border-b border-inherit bg-inherit flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase tracking-widest opacity-50">
                        Neural Link Chat
                      </span>
                      <div className="flex gap-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                        <div className="w-1.5 h-1.5 rounded-full bg-yellow-500" />
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                      </div>
                    </div>
                    <div
                      ref={scrollRef}
                      className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-hide"
                    >
                      {aiMessages.map((m, i) => (
                        <div
                          key={i}
                          className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
                        >
                          <div
                            className={`p-5 rounded-3xl text-[11px] max-w-[85%] leading-relaxed ${m.role === "user" ? "bg-primary text-white font-bold" : isDarkMode ? "bg-white/5 border border-white/10 text-gray-400" : "bg-slate-100 text-slate-700"}`}
                          >
                            {m.content}
                          </div>
                        </div>
                      ))}
                      {isAiLoading && (
                        <div className="flex justify-start">
                          <div className="p-4 rounded-3xl bg-primary/10 text-primary animate-pulse text-[11px]">
                            Neural core thinking...
                          </div>
                        </div>
                      )}
                    </div>
                    <form
                      onSubmit={handleSendAiMessage}
                      className="p-6 bg-inherit border-t border-inherit flex gap-3"
                    >
                      <input
                        value={aiInput}
                        onChange={(e) => setAiInput(e.target.value)}
                        placeholder="Got any Problems??..."
                        className={`flex-1 rounded-2xl px-6 py-4 text-xs outline-none transition-all ${isDarkMode ? "bg-white/5 border-white/10 focus:border-primary/50 text-white" : "bg-slate-50 border-slate-200 focus:border-blue-400 text-slate-900"}`}
                      />
                      <button
                        type="submit"
                        className="w-14 h-14 bg-primary rounded-2xl flex items-center justify-center hover:scale-105 transition-transform shadow-lg shadow-primary/20"
                      >
                        <Icon
                          icon="solar:plain-bold-duotone"
                          className="text-2xl text-white"
                        />
                      </button>
                    </form>
                  </div>

                  <div className="space-y-8">
                    <div
                      className={`rounded-[40px] p-8 border ${isDarkMode ? "bg-[#0D0D0D]/60 border-white/5" : "bg-white border-slate-200 shadow-lg"}`}
                    >
                      <h3 className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-6">
                        Execution Logs
                      </h3>
                      <div className="space-y-4">
                        {transactions.slice(0, 4).map((tx) => (
                          <div
                            key={tx.id}
                            className={`flex justify-between items-center p-5 rounded-3xl border ${isDarkMode ? "bg-white/5 border-white/5" : "bg-slate-50 border-slate-100"}`}
                          >
                            <div className="flex items-center gap-4">
                              <div
                                className={`w-10 h-10 rounded-xl flex items-center justify-center ${tx.type === "buy" ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"}`}
                              >
                                <Icon
                                  icon={
                                    tx.type === "buy"
                                      ? "solar:round-alt-arrow-down-bold"
                                      : "solar:round-alt-arrow-up-bold"
                                  }
                                />
                              </div>
                              <span className="text-[11px] font-black uppercase">
                                {tx.asset}
                              </span>
                            </div>
                            <span className="text-xs font-mono font-bold">
                              ${tx.amount.toLocaleString()}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div
                      className={`rounded-[40px] p-8 border ${isDarkMode ? "bg-gradient-to-br from-primary/20 to-transparent border-primary/20" : "bg-blue-50 border-blue-100"}`}
                    >
                      <h4 className="text-xs font-black uppercase mb-2">
                        Neural Recommendation
                      </h4>
                      <p className="text-[10px] opacity-60 leading-relaxed">
                        System detects low volatility in Tesla-X pools.
                        Recommend shifting 15% to High-Yield Liquid Nodes.
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === "analyze" && (
                <motion.div
                  key="ana"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-8"
                >
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div
                      className={`md:col-span-2 rounded-[50px] p-10 border ${isDarkMode ? "bg-[#0D0D0D]/60 border-white/5" : "bg-white border-slate-200 shadow-xl"}`}
                    >
                      <div className="flex justify-between items-center mb-10">
                        <div>
                          <h3 className="text-xl font-black italic uppercase italic">
                            Neural Performance
                          </h3>
                          <p className="text-[9px] font-black uppercase opacity-30 tracking-[0.3em]">
                            Institutional Growth Metrics
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-black text-primary">
                            +24.8%
                          </p>
                          <p className="text-[8px] font-black uppercase opacity-30">
                            Avg Monthly ROI
                          </p>
                        </div>
                      </div>
                      <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={transactions.slice(0, 8).reverse()}>
                            <defs>
                              <linearGradient
                                id="colorPrice"
                                x1="0"
                                y1="0"
                                x2="0"
                                y2="1"
                              >
                                <stop
                                  offset="5%"
                                  stopColor="#14b8a6"
                                  stopOpacity={0.3}
                                />
                                <stop
                                  offset="95%"
                                  stopColor="#14b8a6"
                                  stopOpacity={0}
                                />
                              </linearGradient>
                            </defs>
                            <Tooltip
                              contentStyle={{
                                background: isDarkMode ? "#0a0a0a" : "#fff",
                                border: "1px solid #222",
                                borderRadius: "15px",
                              }}
                            />
                            <Area
                              type="monotone"
                              dataKey="amount"
                              stroke="#14b8a6"
                              strokeWidth={4}
                              fillOpacity={1}
                              fill="url(#colorPrice)"
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    <div
                      className={`rounded-[50px] p-10 flex flex-col items-center border ${isDarkMode ? "bg-[#0D0D0D]/60 border-white/5" : "bg-white border-slate-200 shadow-xl"}`}
                    >
                      <h3 className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40 mb-10">
                        Quantum Allocation
                      </h3>
                      <div className="h-[250px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={pieData}
                              innerRadius={60}
                              outerRadius={80}
                              paddingAngle={8}
                              dataKey="value"
                            >
                              {pieData.map((entry, index) => (
                                <Cell
                                  key={`cell-${index}`}
                                  fill={COLORS[index % COLORS.length]}
                                />
                              ))}
                            </Pie>
                            <Tooltip />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === "portfolio" && (
                <motion.div
                  key="port"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className={`rounded-[50px] p-12 border ${isDarkMode ? "bg-[#0D0D0D]/60 border-white/5" : "bg-white border-slate-200 shadow-xl"}`}
                >
                  <h2 className="text-3xl font-black italic mb-10 uppercase tracking-tighter">
                    Premium Asset Matrix
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {assets.map((asset) => (
                      <div
                        key={asset.id}
                        className={`p-10 rounded-[40px] transition-all group relative overflow-hidden border ${isDarkMode ? "bg-white/5 border-white/10 hover:border-primary" : "bg-slate-50 border-slate-200 hover:border-blue-400"}`}
                      >
                        <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:rotate-12 transition-transform">
                          <Icon
                            icon="solar:crown-bold-duotone"
                            className="text-6xl"
                          />
                        </div>
                        <Icon
                          icon="solar:box-bold-duotone"
                          className="text-4xl text-primary mb-6"
                        />
                        <p className="text-xl font-black">{asset.asset}</p>
                        <p className="text-4xl font-mono mt-3 text-white transition-colors group-hover:text-primary">
                          ${(asset.amount * 185).toLocaleString()}
                        </p>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {activeTab === "settings" && (
                <motion.div
                  key="set"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="grid grid-cols-1 md:grid-cols-2 gap-8"
                >
                  <div
                    className={`rounded-[50px] p-12 border ${isDarkMode ? "bg-[#0D0D0D]/60 border-white/5" : "bg-white border-slate-200"}`}
                  >
                    <h3 className="text-xs font-black uppercase text-primary mb-10 tracking-widest">
                      Neural Identity
                    </h3>
                    <div className="space-y-8">
                      <InputGroup
                        label="System Codename"
                        value={name}
                        onChange={setName}
                        isDarkMode={isDarkMode}
                      />
                      <InputGroup
                        label="Neural Interface Bio"
                        value={bio}
                        onChange={setBio}
                        isTextArea
                        isDarkMode={isDarkMode}
                      />
                      <button
                        onClick={handleSaveSettings}
                        className="w-full bg-primary text-white py-5 rounded-3xl font-black text-xs uppercase shadow-2xl shadow-primary/40 hover:scale-[1.02] transition-transform"
                      >
                        Sync Protocols
                      </button>
                    </div>
                  </div>

                  <div
                    className={`rounded-[50px] p-12 border ${isDarkMode ? "bg-[#0D0D0D]/60 border-white/5" : "bg-white border-slate-200"}`}
                  >
                    <h3 className="text-xs font-black uppercase text-primary mb-10 tracking-widest">
                      Communication Nodes
                    </h3>
                    <div className="space-y-6">
                      <Toggle
                        icon="solar:letter-bold-duotone"
                        label="Encrypted Email Alerts"
                        active={emailNotif}
                        onClick={() => setEmailNotif(!emailNotif)}
                      />
                      <Toggle
                        icon="solar:smartphone-bold-duotone"
                        label="SMS Hardware Pings"
                        active={smsNotif}
                        onClick={() => setSmsNotif(!smsNotif)}
                      />
                      <Toggle
                        icon="solar:shield-keyhole-bold-duotone"
                        label="Biometric 2FA"
                        active={twoFA}
                        onClick={() => setTwoFA(!twoFA)}
                      />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </section>

          {/* Desktop Sidebar */}
          <aside className="hidden lg:block space-y-6">
            <div
              className={`rounded-[40px] p-4 flex flex-col gap-2 backdrop-blur-3xl border transition-colors ${isDarkMode ? "bg-[#0D0D0D]/80 border-white/10" : "bg-white border-slate-200 shadow-xl"}`}
            >
              <NavBtn
                active={activeTab === "overview"}
                onClick={() => setActiveTab("overview")}
                icon="solar:widget-bold-duotone"
                label="Overview"
                isDarkMode={isDarkMode}
              />
              <NavBtn
                active={activeTab === "portfolio"}
                onClick={() => setActiveTab("portfolio")}
                icon="solar:wallet-bold-duotone"
                label="Portfolio"
                isDarkMode={isDarkMode}
              />
              <NavBtn
                active={activeTab === "analyze"}
                onClick={() => setActiveTab("analyze")}
                icon="solar:chart-square-bold-duotone"
                label="Analyze"
                isDarkMode={isDarkMode}
              />
              <NavBtn
                active={activeTab === "settings"}
                onClick={() => setActiveTab("settings")}
                icon="solar:settings-bold-duotone"
                label="Settings"
                isDarkMode={isDarkMode}
              />
            </div>

            <div
              className={`rounded-[50px] p-10 space-y-8 border ${isDarkMode ? "bg-primary/5 border-primary/20" : "bg-blue-50 border-blue-100 shadow-sm"}`}
            >
              <h5 className="text-[10px] font-black uppercase tracking-[0.4em] text-center opacity-40">
                Elite Modules
              </h5>
              <SidebarFeature
                icon="solar:ghost-bold-duotone"
                title="Shadow Mode"
                desc="Stealth trade execution"
                onClick={() =>
                  triggerModalFeature(
                    "Shadow Mode",
                    "Initializing stealth trade routing...",
                    "solar:ghost-bold-duotone",
                  )
                }
              />
              <SidebarFeature
                icon="solar:safe-2-bold-duotone"
                title="Cold Vault"
                desc="Offline asset storage"
                onClick={() =>
                  triggerModalFeature(
                    "Cold Vault",
                    "Syncing hardware ledger...",
                    "solar:safe-2-bold-duotone",
                  )
                }
              />
              <SidebarFeature
                icon="solar:eye-bold-duotone"
                title="Dark Pool"
                desc="Private liquidity access"
                onClick={() =>
                  triggerModalFeature(
                    "Dark Pool",
                    "Requesting dark pool handshake...",
                    "solar:eye-bold-duotone",
                  )
                }
              />
              <SidebarFeature
                icon="solar:skateboarding-bold-duotone"
                title="High Frequency"
                desc="Nano-second routing"
                onClick={() =>
                  triggerModalFeature(
                    "High Frequency",
                    "Tuning execution latency...",
                    "solar:skateboarding-bold-duotone",
                  )
                }
              />
              <SidebarFeature
                icon="solar:verified-check-bold-duotone"
                title="Audit Node"
                desc="Real-time tax compliance"
                onClick={() =>
                  triggerModalFeature(
                    "Audit Node",
                    "Processing fiscal audit...",
                    "solar:verified-check-bold-duotone",
                  )
                }
              />
              <SidebarFeature
                icon="solar:history-bold-duotone"
                title="Time Machine"
                desc="Backtest neural logic"
                onClick={() =>
                  triggerModalFeature(
                    "Time Machine",
                    "Reconstructing historical data...",
                    "solar:history-bold-duotone",
                  )
                }
              />
              <SidebarFeature
                icon="solar:magic-stick-3-bold-duotone"
                title="Auto-Wealth"
                desc="AI wealth management"
                onClick={() =>
                  triggerModalFeature(
                    "Auto-Wealth",
                    "Allocating AI capital...",
                    "solar:magic-stick-3-bold-duotone",
                  )
                }
              />
            </div>
          </aside>
        </div>
      </main>

      {/* Mobile Nav Dock */}
      <nav
        className={`lg:hidden fixed bottom-6 left-6 right-6 z-[60] rounded-[30px] p-4 flex justify-between items-center backdrop-blur-2xl border transition-all ${isDarkMode ? "bg-black/80 border-white/10" : "bg-white/80 border-slate-200 shadow-2xl"}`}
      >
        <MobileNavIcon
          active={activeTab === "overview"}
          onClick={() => setActiveTab("overview")}
          icon="solar:widget-bold-duotone"
        />
        <MobileNavIcon
          active={activeTab === "portfolio"}
          onClick={() => setActiveTab("portfolio")}
          icon="solar:wallet-bold-duotone"
        />
        <MobileNavIcon
          active={activeTab === "analyze"}
          onClick={() => setActiveTab("analyze")}
          icon="solar:chart-square-bold-duotone"
        />
        <MobileNavIcon
          active={activeTab === "settings"}
          onClick={() => setActiveTab("settings")}
          icon="solar:settings-bold-duotone"
        />
      </nav>

      {/* Feature Modals */}
      <AnimatePresence>
        {activeModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setActiveModal(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-md"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className={`relative w-full max-w-lg rounded-[45px] p-10 border overflow-hidden ${isDarkMode ? "bg-[#0a0a0a] border-primary/30 shadow-2xl shadow-primary/20" : "bg-white border-slate-200 shadow-2xl"}`}
            >
              <div className="flex items-center gap-6 mb-8">
                <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center">
                  <Icon
                    icon={activeModal.icon}
                    className="text-3xl text-primary"
                  />
                </div>
                <div>
                  <h2 className="text-2xl font-black italic uppercase italic">
                    {activeModal.title}
                  </h2>
                  <p className="text-[10px] text-primary font-bold uppercase tracking-widest">
                    Protocol Operational
                  </p>
                </div>
              </div>
              <div className="space-y-6">
                <p className="text-xs opacity-60 leading-relaxed italic">
                  "{activeModal.desc}"
                </p>
                <div
                  className={`h-2 rounded-full overflow-hidden ${isDarkMode ? "bg-white/5" : "bg-slate-100"}`}
                >
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: "100%" }}
                    transition={{ duration: 1.5 }}
                    className="h-full bg-primary"
                  />
                </div>
                {isProcessing ? (
                  <div className="flex items-center gap-3 text-[10px] font-black uppercase text-primary">
                    <Icon
                      icon="solar:refresh-bold"
                      className="animate-spin text-lg"
                    />
                    Synchronizing Neural Link...
                  </div>
                ) : (
                  <button
                    onClick={() => setActiveModal(null)}
                    className="w-full bg-primary text-white py-5 rounded-2xl font-black text-xs uppercase shadow-xl hover:scale-[1.02] transition-transform"
                  >
                    Execute Procedure
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

// --- HELPER COMPONENTS ---

const Badge = ({ icon, label, isDarkMode }: any) => (
  <div
    className={`flex items-center gap-2 px-5 py-2.5 rounded-full backdrop-blur-md border transition-colors ${isDarkMode ? "bg-white/5 border-white/10" : "bg-white border-slate-200 shadow-sm"}`}
  >
    <Icon icon={icon} className="text-primary text-sm" />
    <span className="text-[9px] font-black uppercase opacity-70 tracking-widest">
      {label}
    </span>
  </div>
);

const SidebarFeature = ({ icon, title, desc, onClick }: any) => (
  <div
    onClick={onClick}
    className="flex gap-4 items-center group cursor-pointer transition-all hover:translate-x-1"
  >
    <div className="w-12 h-12 flex-shrink-0 bg-primary/10 rounded-2xl flex items-center justify-center group-hover:bg-primary transition-all duration-500">
      <Icon
        icon={icon}
        className="text-primary group-hover:text-white text-xl"
      />
    </div>
    <div>
      <p className="text-[10px] font-black uppercase tracking-tight">{title}</p>
      <p className="text-[8px] opacity-40 uppercase tracking-tighter leading-tight">
        {desc}
      </p>
    </div>
  </div>
);

const NavBtn = ({ active, onClick, icon, label, isDarkMode }: any) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center justify-between p-6 rounded-[30px] transition-all duration-500 ${active ? "bg-primary text-white shadow-2xl shadow-primary/30 scale-[1.02]" : isDarkMode ? "hover:bg-white/5 opacity-40 hover:opacity-100" : "hover:bg-slate-100 opacity-60 hover:opacity-100"}`}
  >
    <span className="text-[10px] font-black uppercase tracking-widest">
      {label}
    </span>
    <Icon icon={icon} className="text-xl" />
  </button>
);

const MobileNavIcon = ({ active, onClick, icon }: any) => (
  <button
    onClick={onClick}
    className={`p-4 rounded-2xl transition-all ${active ? "bg-primary text-white scale-110" : "opacity-30"}`}
  >
    <Icon icon={icon} className="text-2xl" />
  </button>
);

const InputGroup = ({
  label,
  value,
  onChange,
  isTextArea,
  isDarkMode,
}: any) => (
  <div className="space-y-3">
    <label className="text-[9px] font-black uppercase opacity-40 ml-4 tracking-[0.2em]">
      {label}
    </label>
    {isTextArea ? (
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full rounded-[25px] p-6 text-sm min-h-[120px] outline-none border transition-all ${isDarkMode ? "bg-black border-white/10 focus:border-primary/50 text-white" : "bg-slate-50 border-slate-200 focus:border-blue-400 text-slate-900"}`}
      />
    ) : (
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full rounded-[25px] p-6 text-sm outline-none border transition-all ${isDarkMode ? "bg-black border-white/10 focus:border-primary/50 text-white" : "bg-slate-50 border-slate-200 focus:border-blue-400 text-slate-900"}`}
      />
    )}
  </div>
);

const Toggle = ({ icon, label, active, onClick }: any) => (
  <div className="flex items-center justify-between p-5 rounded-[30px] bg-white/5 border border-white/5">
    <div className="flex items-center gap-5">
      <Icon
        icon={icon}
        className={`text-xl ${active ? "text-primary" : "opacity-20"}`}
      />
      <span className="text-[10px] font-black uppercase tracking-wide">
        {label}
      </span>
    </div>
    <button
      onClick={onClick}
      className={`w-12 h-6 rounded-full relative transition-all ${active ? "bg-primary" : "bg-white/10"}`}
    >
      <motion.div
        animate={{ x: active ? 26 : 4 }}
        className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-lg"
      />
    </button>
  </div>
);

export default ProfilePage;

"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import { Line, Pie } from "react-chartjs-2";
import { Chart, registerables } from "chart.js";
import { Icon } from "@iconify/react";
import Link from "next/link";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";

Chart.register(...registerables);

const ProfilePage = () => {
  const router = useRouter();
  const [isDarkMode, setIsDarkMode] = useState(true);

  // Existing States
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [profilePic, setProfilePic] = useState("");
  const [portfolioValue, setPortfolioValue] = useState(0);
  const [rank, setRank] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [assets, setAssets] = useState<any[]>([]);
  const [selectedAsset, setSelectedAsset] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [bio, setBio] = useState("");
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [isVerified, setIsVerified] = useState(false);

  // Security States
  const [twoFA, setTwoFA] = useState(false);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [factorId, setFactorId] = useState<string | null>(null);
  const [challengeId, setChallengeId] = useState<string | null>(null);

  // 1. Live Badge Logic
  const badges = useMemo(() => {
    const list = [];
    if (portfolioValue > 100000)
      list.push({
        icon: "solar:crown-bold-duotone",
        label: "Whale",
        color: "text-amber-400",
      });
    if (transactions.length > 50)
      list.push({
        icon: "solar:bolt-bold-duotone",
        label: "Active Trader",
        color: "text-primary",
      });
    if (isVerified)
      list.push({
        icon: "solar:shield-check-bold-duotone",
        label: "Guardian",
        color: "text-green-400",
      });
    return list;
  }, [portfolioValue, transactions, isVerified]);

  useEffect(() => {
    const storedTheme = localStorage.getItem("theme");
    if (storedTheme) setIsDarkMode(storedTheme === "dark");

    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) return router.push("/auth/signin");
      setUser(data.session.user);
      setIsVerified(!!data.session.user.email_confirmed_at);
      fetchProfile(data.session.user.id);
    });
  }, []);

  const toggleTheme = () => {
    const newTheme = !isDarkMode;
    setIsDarkMode(newTheme);
    localStorage.setItem("theme", newTheme ? "dark" : "light");
  };

  const fetchProfile = async (userId: string) => {
    try {
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();
      if (profileData) {
        setProfile(profileData);
        setName(profileData.name || "");
        setEmail(profileData.email || "");
        setProfilePic(profileData.profile_pic_url || "");
        setBio(profileData.bio || "");
        setPortfolioValue(profileData.portfolio_value || 0);
      }
      const { data: assetsData } = await supabase
        .from("user_assets")
        .select("*")
        .eq("user_id", userId);
      setAssets(assetsData || []);
      const { data: transactionsData } = await supabase
        .from("transactions")
        .select("*")
        .eq("user_id", userId);
      setTransactions(transactionsData || []);
      fetchRank(userId);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchRank = async (userId: string) => {
    const { data: users } = await supabase
      .from("profiles")
      .select("id, portfolio_value")
      .order("portfolio_value", { ascending: false });
    if (users) setRank(users.findIndex((u) => u.id === userId) + 1);
  };

  const handleSave = async () => {
    const loading = toast.loading("Syncing Neural Identity...");
    const { error } = await supabase
      .from("profiles")
      .update({ name, email, profile_pic_url: profilePic, bio })
      .eq("id", user.id);
    toast.dismiss(loading);
    if (!error) {
      toast.success("Identity Re-synced Successfully");
      setIsEditingBio(false);
    }
  };

  const handle2FA = async () => {
    const { data } = await supabase.auth.mfa.listFactors();
    const factors = data?.all ?? [];
    if (factors.length > 0) {
      await supabase.auth.mfa.unenroll({ factorId: factors[0].id });
      setTwoFA(false);
      toast.success("Security Layer Removed");
    } else {
      const { data: enrollData } = await supabase.auth.mfa.enroll({
        factorType: "totp",
      });
      if (enrollData) {
        const { data: challengeData } = await supabase.auth.mfa.challenge({
          factorId: enrollData.id,
        });
        setChallengeId(challengeData?.id ?? null);
        setQrCode(enrollData.totp.qr_code);
        setFactorId(enrollData.id);
      }
    }
  };

  const verifyCode = async (code: string) => {
    if (code.length !== 6 || !factorId || !challengeId) return;
    const { error } = await supabase.auth.mfa.verify({
      factorId,
      challengeId,
      code,
    });
    if (!error) {
      setTwoFA(true);
      setQrCode(null);
      toast.success("MFA Handshake Complete");
    }
  };

  const portfolioChartData = useMemo(() => {
    const sorted = [...transactions].sort(
      (a, b) =>
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
    );
    let total = 0;
    const timeline = sorted.map((tx) => {
      if (tx.type === "buy") total += tx.amount * tx.price;
      else if (tx.type === "sell") total -= tx.amount * tx.price;
      return total;
    });
    return {
      labels: sorted.map((t) => new Date(t.created_at).toLocaleDateString()),
      datasets: [
        {
          label: "Equity",
          data: timeline,
          fill: true,
          borderColor: isDarkMode ? "#14b8a6" : "#0d9488",
          backgroundColor: isDarkMode
            ? "rgba(20, 184, 166, 0.05)"
            : "rgba(13, 148, 136, 0.05)",
          tension: 0.5,
          pointRadius: 0,
        },
      ],
    };
  }, [transactions, isDarkMode]);

  // Premium Animation Variants
  const containerVars = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, staggerChildren: 0.1 },
    },
  };
  const itemVars = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { opacity: 1, scale: 1 },
  };

  return (
    <div
      className={`min-h-screen transition-colors duration-700 ${isDarkMode ? "bg-[#050505] text-white" : "bg-[#f8fafc] text-slate-900"}`}
    >
      {/* 2. Floating Background Aura */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div
          className={`absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full blur-[120px] opacity-20 ${isDarkMode ? "bg-primary" : "bg-teal-200"}`}
        ></div>
        <div
          className={`absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full blur-[120px] opacity-20 ${isDarkMode ? "bg-blue-600" : "bg-blue-200"}`}
        ></div>
      </div>

      <header className="max-w-7xl mx-auto flex justify-between items-center p-6 md:p-10 relative z-10">
        <Link href="/dashboard" className="group flex items-center gap-3">
          <div
            className={`p-2 rounded-xl border transition-all ${isDarkMode ? "bg-white/5 border-white/10 group-hover:bg-white/10" : "bg-black/5 border-black/10 group-hover:bg-black/10"}`}
          >
            <Icon
              icon="solar:alt-arrow-left-bold-duotone"
              className="text-xl"
            />
          </div>
          <span className="text-[10px] font-black uppercase tracking-[0.4em] opacity-60">
            Terminal
          </span>
        </Link>

        <div className="flex items-center gap-4">
          <button
            onClick={toggleTheme}
            className={`p-3 rounded-2xl border transition-all ${isDarkMode ? "bg-white/5 border-white/10 hover:bg-white/10" : "bg-black/5 border-black/10 hover:bg-black/10"}`}
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
            className={`px-5 py-2 rounded-full border flex items-center gap-3 ${isDarkMode ? "bg-white/5 border-white/5" : "bg-black/5 border-black/5"}`}
          >
            <div
              className={`w-2 h-2 rounded-full animate-pulse ${isVerified ? "bg-primary shadow-[0_0_10px_#14b8a6]" : "bg-amber-500"}`}
            ></div>
            <span className="text-[9px] font-black uppercase tracking-widest">
              {isVerified ? "Identity Verified" : "Action Required"}
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 relative z-10">
        <motion.section
          variants={containerVars}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 lg:grid-cols-4 gap-8 mb-12"
        >
          {/* Identity Card */}
          <motion.div
            variants={itemVars}
            className={`lg:col-span-3 rounded-[40px] p-10 relative overflow-hidden border shadow-2xl transition-colors ${isDarkMode ? "bg-[#0D0D0D]/80 border-white/5 backdrop-blur-xl" : "bg-white border-slate-200"}`}
          >
            <div className="flex flex-col md:flex-row gap-10 items-center">
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-primary to-blue-500 rounded-full opacity-30 blur group-hover:opacity-100 transition duration-1000"></div>
                <div className="relative w-36 h-36 rounded-full overflow-hidden border-2 border-white/10 bg-black">
                  <img
                    src={
                      profilePic ||
                      "https://api.dicebear.com/7.x/avataaars/svg?seed=Tesla"
                    }
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                </div>
              </div>

              <div className="flex-1 text-center md:text-left">
                <div className="flex items-center justify-center md:justify-start gap-4 mb-2">
                  <h1 className="text-4xl md:text-5xl font-black italic uppercase tracking-tighter">
                    {name || "OPERATOR"}
                  </h1>
                  <div className="flex gap-2">
                    {badges.map((b, i) => (
                      <Icon
                        key={i}
                        icon={b.icon}
                        className={`text-2xl ${b.color} animate-bounce`}
                      />
                    ))}
                  </div>
                </div>
                <p className="text-primary text-[10px] font-black uppercase tracking-[0.5em] mb-6">
                  {email}
                </p>

                <div className="flex flex-wrap gap-4 justify-center md:justify-start">
                  {[
                    "Level 4 Clear",
                    "Neural Sync Active",
                    "Bio-Sec Enabled",
                  ].map((tag) => (
                    <span
                      key={tag}
                      className={`text-[8px] font-black uppercase px-3 py-1 rounded-lg border ${isDarkMode ? "bg-white/5 border-white/10 text-white/40" : "bg-black/5 border-black/10 text-black/40"}`}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* 3. Live Log Stream */}
            <div className="mt-10 pt-8 border-t border-white/5 grid grid-cols-2 md:grid-cols-4 gap-6">
              {[
                {
                  label: "Global Standing",
                  val: `#${rank || "---"}`,
                  icon: "solar:ranking-bold-duotone",
                },
                {
                  label: "Neural Equity",
                  val: `$${portfolioValue.toLocaleString()}`,
                  icon: "solar:banknote-2-bold-duotone",
                  color: "text-primary",
                },
                {
                  label: "Total Handshakes",
                  val: transactions.length,
                  icon: "solar:transfer-horizontal-bold-duotone",
                },
                {
                  label: "Uptime Status",
                  val: "99.9%",
                  icon: "solar:cloud-check-bold-duotone",
                },
              ].map(
                (stat, i) =>
                  stat.label && (
                    <div key={i} className="space-y-1">
                      <div className="flex items-center gap-2 opacity-40">
                        <Icon icon={stat.icon} className="text-xs" />
                        <p className="text-[9px] font-black uppercase tracking-widest">
                          {stat.label}
                        </p>
                      </div>
                      <p
                        className={`text-2xl font-black italic ${stat.color || ""}`}
                      >
                        {stat.val}
                      </p>
                    </div>
                  ),
              )}
            </div>
          </motion.div>

          {/* Premium Navigation */}
          <motion.div
            variants={itemVars}
            className={`rounded-[40px] p-4 flex flex-col gap-2 border transition-colors ${isDarkMode ? "bg-[#0D0D0D]/80 border-white/5 backdrop-blur-xl" : "bg-white border-slate-200"}`}
          >
            {["overview", "portfolio", "analytics", "settings"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`group relative flex items-center justify-between px-6 py-5 rounded-[25px] transition-all duration-500 overflow-hidden ${activeTab === tab ? "bg-primary text-white shadow-[0_10px_30px_rgba(20,184,166,0.4)]" : "hover:bg-primary/10 opacity-60 hover:opacity-100"}`}
              >
                <span className="text-[10px] font-black uppercase tracking-[0.2em] relative z-10">
                  {tab}
                </span>
                <Icon
                  icon={
                    tab === "overview"
                      ? "solar:widget-bold-duotone"
                      : tab === "portfolio"
                        ? "solar:wallet-bold-duotone"
                        : tab === "analytics"
                          ? "solar:chart-square-bold-duotone"
                          : "solar:settings-bold-duotone"
                  }
                  className="text-xl relative z-10 group-hover:rotate-12 transition-transform"
                />
              </button>
            ))}
          </motion.div>
        </motion.section>

        {/* Dynamic Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.4 }}
            className="min-h-[500px]"
          >
            {activeTab === "overview" && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div
                  className={`lg:col-span-2 rounded-[40px] p-8 border transition-colors ${isDarkMode ? "bg-[#0D0D0D]/80 border-white/5 backdrop-blur-xl" : "bg-white border-slate-200"}`}
                >
                  <div className="flex justify-between items-center mb-8">
                    <h3 className="text-[10px] font-black uppercase tracking-widest opacity-40">
                      Equity Growth Curve
                    </h3>
                    <Icon
                      icon="solar:graph-up-bold-duotone"
                      className="text-primary animate-pulse"
                    />
                  </div>
                  <div className="h-[300px]">
                    {portfolioChartData && (
                      <Line
                        data={portfolioChartData}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: { legend: { display: false } },
                          scales: {
                            y: { grid: { display: false } },
                            x: { display: false },
                          },
                        }}
                      />
                    )}
                  </div>
                </div>
                <div
                  className={`rounded-[40px] p-8 border overflow-hidden transition-colors ${isDarkMode ? "bg-[#0D0D0D]/80 border-white/5 backdrop-blur-xl" : "bg-white border-slate-200"}`}
                >
                  <h3 className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-6">
                    Real-time Stream
                  </h3>
                  <div className="space-y-4 font-mono">
                    {transactions.slice(0, 6).map((tx, i) => (
                      <div
                        key={tx.id}
                        className="flex gap-4 items-center text-[10px] opacity-80 border-b border-white/5 pb-2"
                      >
                        <span className="text-primary">
                          {new Date(tx.created_at).toLocaleTimeString()}
                        </span>
                        <span className="flex-1 uppercase font-bold truncate">
                          {tx.asset} Handshake
                        </span>
                        <span
                          className={
                            tx.type === "buy"
                              ? "text-green-500"
                              : "text-red-400"
                          }
                        >
                          ${tx.price}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === "portfolio" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div
                  className={`rounded-[40px] p-8 border transition-colors ${isDarkMode ? "bg-[#0D0D0D]/80 border-white/5 backdrop-blur-xl" : "bg-white border-slate-200"}`}
                >
                  <h3 className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-8">
                    Asset Matrix
                  </h3>
                  <div className="grid grid-cols-1 gap-4">
                    {assets.map((asset) => (
                      <motion.div
                        whileHover={{ scale: 1.02 }}
                        key={asset.id}
                        onClick={() => setSelectedAsset(asset)}
                        className={`p-6 rounded-3xl border cursor-pointer transition-all ${selectedAsset?.asset === asset.asset ? "border-primary bg-primary/10" : "border-white/5 bg-white/5 hover:border-white/20"}`}
                      >
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="text-xl font-black italic">
                              {asset.asset}
                            </p>
                            <p className="text-[9px] font-bold opacity-40 uppercase tracking-widest">
                              Holdings: {asset.amount}
                            </p>
                          </div>
                          <Icon
                            icon="solar:round-alt-arrow-right-bold-duotone"
                            className={`text-2xl transition-transform ${selectedAsset?.asset === asset.asset ? "rotate-90 text-primary" : "opacity-20"}`}
                          />
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
                <div
                  className={`rounded-[40px] p-8 border flex flex-col items-center justify-center transition-colors ${isDarkMode ? "bg-[#0D0D0D]/80 border-white/5 backdrop-blur-xl" : "bg-white border-slate-200"}`}
                >
                  {selectedAsset ? (
                    <div className="w-full">
                      <h3 className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-10 text-center">
                        {selectedAsset.asset} Depth Analysis
                      </h3>
                      <div className="h-[250px]">
                        <Line
                          data={{
                            labels: transactions
                              .filter((t) => t.asset === selectedAsset.asset)
                              .map((t) =>
                                new Date(t.created_at).toLocaleDateString(),
                              ),
                            datasets: [
                              {
                                label: "Units",
                                data: transactions
                                  .filter(
                                    (t) => t.asset === selectedAsset.asset,
                                  )
                                  .map((t) => t.amount),
                                borderColor: "#14b8a6",
                                tension: 0.5,
                              },
                            ],
                          }}
                          options={{
                            responsive: true,
                            maintainAspectRatio: false,
                          }}
                        />
                      </div>
                    </div>
                  ) : (
                    <Icon
                      icon="solar:folder-security-bold-duotone"
                      className="text-6xl opacity-10"
                    />
                  )}
                </div>
              </div>
            )}

            {activeTab === "settings" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div
                  className={`rounded-[40px] p-10 border transition-colors ${isDarkMode ? "bg-[#0D0D0D]/80 border-white/5 backdrop-blur-xl" : "bg-white border-slate-200"}`}
                >
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-primary mb-10">
                    Neural Interface Identity
                  </h3>
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-[9px] font-black uppercase opacity-40 tracking-widest ml-4">
                        Codename
                      </label>
                      <input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className={`w-full border-0 rounded-3xl p-5 text-sm transition-all outline-none ${isDarkMode ? "bg-white/5 focus:bg-white/10" : "bg-black/5 focus:bg-black/10"}`}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[9px] font-black uppercase opacity-40 tracking-widest ml-4">
                        Authorized Bio
                      </label>
                      <textarea
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                        className={`w-full border-0 rounded-3xl p-5 text-sm transition-all outline-none min-h-[100px] ${isDarkMode ? "bg-white/5 focus:bg-white/10" : "bg-black/5 focus:bg-black/10"}`}
                      />
                    </div>
                    <button
                      onClick={handleSave}
                      className="w-full bg-primary py-5 rounded-[25px] font-black text-[10px] uppercase tracking-[0.4em] shadow-xl shadow-primary/20 hover:scale-[1.02] transition-transform"
                    >
                      Initialize Sync
                    </button>
                  </div>
                </div>

                <div
                  className={`rounded-[40px] p-10 border transition-colors ${isDarkMode ? "bg-[#0D0D0D]/80 border-white/5 backdrop-blur-xl" : "bg-white border-slate-200"}`}
                >
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-primary mb-10">
                    Security Protocols
                  </h3>
                  <div className="space-y-6">
                    <div
                      className={`flex items-center justify-between p-6 rounded-3xl border ${isDarkMode ? "bg-white/5 border-white/5" : "bg-black/5 border-black/5"}`}
                    >
                      <div>
                        <p className="text-xs font-black uppercase">
                          Multi-Factor Layer
                        </p>
                        <p className="text-[9px] opacity-40 uppercase">
                          Hardware Handshake
                        </p>
                      </div>
                      <button
                        onClick={handle2FA}
                        className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${twoFA ? "bg-primary/20 text-primary border border-primary/20" : "bg-primary text-white"}`}
                      >
                        {twoFA ? "ENABLED" : "ACTIVATE"}
                      </button>
                    </div>
                    {qrCode && (
                      <div className="p-6 bg-white rounded-3xl flex flex-col items-center animate-bounce-short">
                        <div dangerouslySetInnerHTML={{ __html: qrCode }} />
                        <input
                          placeholder="ENTER 6-DIGIT CODE"
                          maxLength={6}
                          onChange={(e) => verifyCode(e.target.value)}
                          className="mt-6 text-center text-black font-black tracking-[0.4em] bg-black/5 rounded-2xl p-4 w-full outline-none"
                        />
                      </div>
                    )}
                    <button
                      onClick={() =>
                        confirm("Execute Permanent Deletion?") &&
                        toast.error("ACCESS DENIED: LEVEL 4 ONLY")
                      }
                      className="w-full border border-red-500/20 text-red-500 py-5 rounded-[25px] text-[10px] font-black uppercase tracking-[0.4em] hover:bg-red-500 hover:text-white transition-all"
                    >
                      Terminate Protocols
                    </button>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      <footer className="mt-20 p-10 text-center relative z-10 border-t border-white/5">
        <p
          className={`text-[8px] font-black uppercase tracking-[2em] opacity-20 ${isDarkMode ? "text-white" : "text-black"}`}
        >
          Neural System Core © 2026
        </p>
      </footer>
    </div>
  );
};

export default ProfilePage;

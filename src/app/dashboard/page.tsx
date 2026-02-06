"use client";

import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import Link from "next/link";
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination, Autoplay } from "swiper/modules";
import { CSVLink } from "react-csv";
import { Icon } from "@iconify/react";

// Components
import BuyCrypto from "@/components/Home/Hero/buy-form";
import SellCrypto from "@/components/Home/Hero/sell-form";
import DepositForm from "@/components/Home/Hero/deposit-form";
import WithdrawForm from "@/components/Home/Hero/withdraw-form";

// Types
interface Transaction {
  id: string;
  type: "buy" | "sell" | "deposit" | "withdraw";
  asset: string;
  amount: number;
  price?: number;
  created_at: string;
  status: "pending" | "completed" | "failed";
}

const Dashboard = () => {
  const router = useRouter();
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [user, setUser] = useState<any>(null);
  const [balance, setBalance] = useState(0);
  const [lockedBalance, setLockedBalance] = useState(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [news, setNews] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [visibleNews, setVisibleNews] = useState(6);

  // UI States
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [isAiOpen, setIsAiOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [aiInput, setAiInput] = useState("");
  const [aiMessages, setAiMessages] = useState([
    {
      role: "ai",
      text: `Neural Link established. Portfolio analysis complete. Ready for high-frequency execution.`,
    },
  ]);

  // --- VAULT INTEGRATION LOGIC ---

  // STEP 1: Start the Protocol (The UI Trigger)
  const handleTransferInitiation = () => {
    // Show the security toast
    toast.loading("Establishing Secure Connection...", {
      id: "vault-protocol",
      style: {
        background: "#0D0D0D",
        color: "#fff",
        border: "1px solid rgba(20, 184, 166, 0.2)",
      },
      icon: (
        <Icon
          icon="solar:shield-keyhole-bold-duotone"
          className="text-primary"
        />
      ),
    });

    // Wait 2 seconds for "Atmosphere," then open the modal
    setTimeout(() => {
      toast.dismiss("vault-protocol");
      setActiveModal("vault-transfer");
    }, 2000);
  };

  // STEP 2: Execute the Move (The Database Trigger)
  const handleVaultRelease = async () => {
    // 1. Initial visual feedback
    const loadingToast = toast.loading("Executing Re-allocation...", {
      style: {
        background: "#0D0D0D",
        color: "#fff",
        border: "1px solid rgba(20, 184, 166, 0.2)",
      },
    });

    try {
      // 2. Call the SQL function you created in Supabase
      const { error } = await supabase.rpc("initiate_vault_transfer", {
        user_id_param: user.id,
      });

      // 3. Dismiss loading state immediately after DB responds
      toast.dismiss(loadingToast);

      if (error) {
        console.error("Vault Error:", error.message);
        toast.error("Protocol Failed: Security Intercepted");
      } else {
        // SUCCESS CASE
        toast.success("Protocol Success: Assets Unlocked", {
          icon: "🔓",
        });

        // 4. SMART REFRESH: This checks which refresh function exists in your current page
        // If you are on Dashboard, it calls fetchAll. If on Vault, it calls fetchVaultData.
        if (typeof fetchAll === "function") {
          fetchAll(user.id);
        } else if (typeof (window as any).fetchVaultData === "function") {
          // Fallback for global scope if necessary
          (window as any).fetchVaultData(user.id);
        }

        // 5. Close the UI Modal
        setActiveModal(null);
      }
    } catch (err) {
      toast.dismiss(loadingToast);
      toast.error("System Exception: Handshake Interrupted");
      console.error(err);
    }
  };
  const handleSendMessage = () => {
    if (!aiInput.trim()) return;
    const newMessages = [...aiMessages, { role: "user", text: aiInput }];
    setAiMessages(newMessages);
    setAiInput("");
    setTimeout(() => {
      setAiMessages((prev) => [
        ...prev,
        {
          role: "ai",
          text: "Analyzing global Tesla-X liquidity pools... Signal: BULLISH. Recommend optimizing collateral.",
        },
      ]);
    }, 1000);
  };

  useEffect(() => {
    if (!user) return;

    // Listen for changes to the 'wallets' table for the current user
    const walletSubscription = supabase
      .channel("wallet-updates")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "wallets",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          // Update local state immediately with new data from DB
          setBalance(Number(payload.new.balance));
          setLockedBalance(Number(payload.new.locked_balance || 0));
          toast.success("Balances Synchronized", { icon: "🔄" });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(walletSubscription);
    };
  }, [user]);

  useEffect(() => {
    const savedTheme =
      (localStorage.getItem("theme") as "dark" | "light") || "dark";
    setTheme(savedTheme);
    document.documentElement.classList.toggle("dark", savedTheme === "dark");

    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) return router.push("/auth/signin");
      setUser(data.session.user);
      fetchAll(data.session.user.id);
      fetchNews();
      setLoading(false);
    });
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    document.documentElement.classList.toggle("dark", newTheme === "dark");
  };

  const fetchAll = async (userId: string) => {
    const { data: wallet } = await supabase
      .from("wallets")
      .select("*")
      .eq("user_id", userId)
      .single();
    const { data: txs } = await supabase
      .from("transactions")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    const { data: prof } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (wallet) {
      setBalance(Number(wallet.balance));
      setLockedBalance(Number(wallet.locked_balance || 0));
    }
    if (txs) setTransactions(txs);
    if (prof) setProfile(prof);
  };

  const fetchNews = async () => {
    try {
      const res = await fetch(
        `https://api.marketaux.com/v1/news/all?symbols=TSLA&api_token=${process.env.NEXT_PUBLIC_MARKETAUX_KEY}`,
      );
      const data = await res.json();
      setNews(data.data || []);
    } catch (e) {
      console.error("News failed");
    }
  };

  if (loading)
    return (
      <div className="h-screen w-full flex items-center justify-center bg-white dark:bg-[#050505]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-primary"></div>
      </div>
    );

  const availableBalance = Math.max(0, balance - lockedBalance);

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#050505] text-slate-900 dark:text-white transition-colors duration-500 overflow-x-hidden">
      {/* --- PREMIUM DESKTOP SIDEBAR --- */}
      <aside className="fixed left-0 top-0 h-full w-20 lg:w-64 bg-white dark:bg-[#0D0D0D]/80 backdrop-blur-xl border-r border-slate-200 dark:border-white/5 hidden md:flex flex-col items-center py-8 z-50">
        <div className="mb-10 text-primary font-black text-2xl hidden lg:block tracking-tighter italic">
          TESLA<span className="text-slate-400 font-light">X</span>
        </div>
        <div className="flex flex-col gap-3 w-full px-4">
          <Link
            href="/"
            className="flex items-center gap-4 p-4 rounded-2xl text-slate-400 hover:bg-primary/10 hover:text-primary transition-all group"
          >
            <Icon icon="solar:home-2-bold" className="text-2xl" />
            <span className="font-bold hidden lg:block text-sm uppercase">
              Home
            </span>
          </Link>
          <NavItem icon="solar:widget-bold" label="Dashboard" active />
          <NavItem
            icon="solar:graph-up-bold"
            label="Markets"
            href="https://tesla-stockbox.vercel.app"
          />
          <Link
            href="/dashboard/vault"
            className="flex items-center gap-4 p-4 rounded-2xl text-slate-400 hover:bg-primary/10 hover:text-primary transition-all group"
          >
            <Icon icon="solar:safe-2-bold" className="text-2xl" />
            <span className="font-bold hidden lg:block text-sm uppercase">
              The Vault
            </span>
          </Link>
          <Link
            href="/profile"
            className="flex items-center gap-4 p-4 rounded-2xl text-slate-400 hover:bg-primary/10 hover:text-primary transition-all group"
          >
            <Icon icon="solar:user-circle-bold" className="text-2xl" />
            <span className="font-bold hidden lg:block text-sm uppercase">
              Portfolio
            </span>
          </Link>
        </div>
        <div className="mt-auto flex flex-col items-center gap-6">
          <button
            onClick={toggleTheme}
            className="p-3 rounded-xl bg-slate-100 dark:bg-white/5 text-primary shadow-inner"
          >
            <Icon
              icon={
                theme === "dark"
                  ? "solar:sun-bold-duotone"
                  : "solar:moon-bold-duotone"
              }
              className="text-xl"
            />
          </button>
          <Link href="/profile" className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-primary to-blue-600 rounded-full blur opacity-25 group-hover:opacity-75 transition duration-1000 group-hover:duration-200 animate-pulse"></div>
            <img
              src={profile?.profile_pic_url || "/default-avatar.jpg"}
              className="relative w-14 h-14 rounded-full border-2 border-white dark:border-[#0D0D0D] object-cover shadow-2xl"
            />
          </Link>
        </div>
      </aside>

      {/* --- MAIN CONTENT AREA --- */}
      <main className="md:ml-20 lg:ml-64 p-4 md:p-10 pb-32">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-4">
          <div className="animate-in fade-in slide-in-from-left-5 duration-700">
            <h1 className="text-3xl md:text-4xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-slate-900 via-slate-700 to-slate-900 dark:from-white dark:via-slate-300 dark:to-white">
              Elite Access: {profile?.full_name?.toUpperCase() || "TRADER"}
            </h1>
            <p className="text-primary font-bold text-xs uppercase tracking-[0.3em] flex items-center gap-2 mt-2">
              <span className="w-2 h-2 bg-primary rounded-full animate-ping" />
              Maximize your holdings today
            </p>
          </div>
        </header>

        {/* --- PREMIUM NET WORTH GRID --- */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          <div className="lg:col-span-2 relative overflow-hidden group bg-[#0A0A0A] p-10 rounded-[45px] text-white shadow-[0_30px_60px_-15px_rgba(20,184,166,0.3)] border border-white/5">
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-4">
                <Icon
                  icon="solar:globus-bold"
                  className="text-primary text-xl animate-spin-slow"
                />
                <span className="text-white/40 text-[10px] font-black uppercase tracking-[0.4em]">
                  Global Equity
                </span>
              </div>
              <h2 className="text-5xl md:text-7xl font-black mb-12 tracking-tighter italic">
                ${balance.toLocaleString()}
              </h2>
              <div className="flex flex-wrap gap-6">
                <div className="bg-white/5 backdrop-blur-2xl p-6 rounded-[28px] border border-white/10 min-w-[160px] hover:bg-white/10 transition-all">
                  <div className="flex items-center gap-2 mb-1">
                    <Icon
                      icon="solar:banknote-bold"
                      className="text-green-400"
                    />
                    <p className="text-white/30 text-[10px] font-bold uppercase tracking-widest">
                      Liquid
                    </p>
                  </div>
                  <p className="text-2xl font-black text-green-400">
                    ${availableBalance.toLocaleString()}
                  </p>
                </div>
                <div className="bg-white/5 backdrop-blur-2xl p-6 rounded-[28px] border border-white/10 min-w-[160px] hover:bg-white/10 transition-all">
                  <div className="flex items-center gap-2 mb-1">
                    <Icon icon="solar:lock-bold" className="text-orange-400" />
                    <p className="text-white/30 text-[10px] font-bold uppercase tracking-widest">
                      Escrow
                    </p>
                  </div>
                  <p className="text-2xl font-black text-orange-400">
                    ${lockedBalance.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
            {/* Background Lightning Effect */}
            <div className="absolute top-[-20%] right-[-10%] w-[500px] h-[500px] bg-primary opacity-10 rounded-full blur-[120px] animate-pulse" />
            <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-primary/5 to-transparent pointer-events-none" />
          </div>
        </div>
        {/* --- INSTITUTIONAL TOOLS (QUICK ACTIONS) --- */}
        <div className="bg-white dark:bg-[#0D0D0D] border dark:border-white/5 p-10 rounded-[45px] shadow-2xl flex flex-col justify-center relative overflow-hidden group">
          <div className="absolute top-[-20px] right-[-20px] opacity-[0.03] dark:opacity-[0.05] group-hover:opacity-10 transition-opacity duration-700">
            <Icon
              icon="solar:layers-bold-duotone"
              className="text-[200px] text-primary"
            />
          </div>

          <div className="relative z-10">
            <h3 className="text-[10px] font-black text-slate-400 mb-10 uppercase tracking-[0.4em] flex items-center gap-2">
              <span className="w-1 h-1 bg-primary rounded-full animate-pulse"></span>
              Institutional Tools
            </h3>

            <div className="grid grid-cols-2 gap-x-8 gap-y-10">
              <ActionButton
                icon="solar:round-transfer-vertical-bold-duotone" // New balanced Deposit icon
                label="Deposit"
                color="bg-primary"
                onClick={() => setActiveModal("deposit")}
              />
              <ActionButton
                icon="solar:card-transfer-bold-duotone" // New balanced Withdraw icon
                label="Withdraw"
                color="bg-slate-800"
                onClick={() => setActiveModal("withdraw")}
              />
              <ActionButton
                icon="solar:cart-large-2-bold-duotone" // New balanced Buy icon
                label="Buy"
                color="bg-primary"
                onClick={() => setActiveModal("buy")}
              />
              <ActionButton
                icon="solar:tag-price-bold-duotone" // New balanced Sell icon
                label="Sell"
                color="bg-slate-800"
                onClick={() => setActiveModal("sell")}
              />
            </div>
          </div>
        </div>

        {/* --- THE TESLA EXPERIENCE VIDEO SECTION --- */}
        <section className="mb-12">
          <div className="relative rounded-[50px] overflow-hidden group h-[500px] shadow-[0_0_50px_rgba(0,0,0,0.3)] border border-white/10 bg-[#050505]">
            {/* ACTUAL LOCAL VIDEO TAG */}
            <video
              autoPlay
              muted
              loop
              playsInline
              className="absolute inset-0 w-full h-full object-cover opacity-60 scale-110 group-hover:scale-100 transition-transform duration-[5000ms] ease-out"
            >
              <source src="/images/ecosystem/vid3.webm" type="video/webm" />
              Your browser does not support the video tag.
            </video>

            {/* OVERLAY GRADIENT - Making it look like a High-End Cinema */}
            <div className="absolute inset-0 bg-gradient-to-r from-[#050505] via-[#050505]/40 to-transparent p-8 md:p-16 flex flex-col justify-center">
              <div className="max-w-xl animate-in fade-in slide-in-from-left-10 duration-1000">
                {/* PREMIUM BADGE */}
                <div className="flex items-center gap-3 mb-6">
                  <span className="bg-primary/20 backdrop-blur-md border border-primary/30 text-primary text-[10px] px-4 py-1.5 rounded-full font-black uppercase tracking-[0.3em]">
                    Elite Interior Experience
                  </span>
                  <div className="h-[1px] w-12 bg-primary/30"></div>
                </div>

                <h2 className="text-5xl md:text-7xl font-black text-white mb-6 leading-[0.85] tracking-tighter italic uppercase">
                  Total <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-500">
                    Immersion.
                  </span>
                </h2>

                <p className="text-slate-300 text-lg md:text-xl font-medium mb-10 leading-relaxed max-w-sm">
                  Your Tesla-X interface isn't just a dashboard—it's a command
                  center for the modern titan.
                </p>

                <div className="flex items-center gap-6">
                  <button
                    onClick={() => setActiveModal("deposit")}
                    className="group relative bg-white text-black px-10 py-5 rounded-[22px] font-black text-xs uppercase tracking-widest overflow-hidden transition-all shadow-2xl hover:shadow-primary/20"
                  >
                    <span className="relative z-10 flex items-center gap-2">
                      Upgrade Status{" "}
                      <Icon
                        icon="solar:round-alt-arrow-right-bold"
                        className="text-xl group-hover:translate-x-1 transition-transform"
                      />
                    </span>
                    <div className="absolute inset-0 bg-primary translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                  </button>

                  <div className="hidden md:flex items-center gap-3 text-white/40">
                    <div className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center animate-pulse">
                      <Icon icon="solar:play-bold" />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-widest">
                      Live Preview
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* PREMIUM GLASS BORDER */}
            <div className="absolute inset-0 border-[1px] border-white/10 rounded-[50px] pointer-events-none shadow-inner" />

            {/* LIGHTING BOLT ACCENT */}
            <div className="absolute top-0 right-0 p-10 opacity-20">
              <Icon
                icon="solar:bolt-circle-bold-duotone"
                className="text-8xl text-primary animate-pulse"
              />
            </div>
          </div>
        </section>

        {/* --- ASSET WATCHLIST --- */}
        <section className="bg-white dark:bg-[#0D0D0D] border dark:border-white/5 rounded-[45px] p-10 mb-12 relative">
          <div className="absolute top-0 right-10 -translate-y-1/2 flex gap-4">
            <div className="bg-primary p-3 rounded-2xl shadow-xl text-white">
              <Icon icon="solar:bolt-bold" />
            </div>
          </div>
          <h3 className="font-black text-xs uppercase tracking-[0.4em] mb-10 text-slate-400">
            Live Asset Tracking
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <WatchItem
              symbol="TSLA"
              name="Tesla, Inc"
              price="248.50"
              change="+4.2%"
              up
            />
            <WatchItem
              symbol="BTC"
              name="Bitcoin"
              price="68,432.10"
              change="+1.8%"
              up
            />
            <WatchItem
              symbol="ETH"
              name="Ethereum"
              price="2,450.00"
              change="-0.5%"
              up={false}
            />
          </div>
        </section>
      </main>

      {activeModal === "vault-transfer" && (
        <div className="text-white">
          {/* SCANNING ANIMATION HEADER */}
          <div className="flex flex-col items-center mb-8">
            <div className="relative w-24 h-24 mb-4">
              <div className="absolute inset-0 border-2 border-primary/20 rounded-full"></div>
              <div className="absolute inset-0 border-t-2 border-primary rounded-full animate-spin"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <Icon
                  icon="solar:fingerprint-bold-duotone"
                  className="text-4xl text-primary animate-pulse"
                />
              </div>
            </div>
            <h3 className="text-xl font-black italic uppercase tracking-tighter">
              Identity Verified
            </h3>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.3em]">
              Accessing Cold Storage
            </p>
          </div>

          {/* TRANSFER DETAILS */}
          <div className="space-y-4 mb-8">
            <div className="bg-white/5 border border-white/10 p-5 rounded-[25px]">
              <div className="flex justify-between items-center mb-2">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                  Vault Balance
                </span>
                <span className="text-xs font-bold text-primary italic">
                  Secured
                </span>
              </div>
              <p className="text-2xl font-black italic">
                ${lockedBalance.toLocaleString()}
              </p>
            </div>

            <div className="flex flex-col gap-2 p-2">
              <div className="flex justify-between text-[11px] font-bold">
                <span className="text-slate-400">Network Protocol</span>
                <span className="text-white uppercase tracking-tighter text-right">
                  Tesla-X Mainnet v4.0
                </span>
              </div>
              <div className="flex justify-between text-[11px] font-bold">
                <span className="text-slate-400">Release Latency</span>
                <span className="text-white uppercase tracking-tighter text-right">
                  Instant Re-allocation
                </span>
              </div>
            </div>
          </div>

          {/* WARNING ADVISORY */}
          <div className="bg-orange-500/10 border border-orange-500/20 p-4 rounded-2xl mb-8 flex gap-3 items-start">
            <Icon
              icon="solar:danger-bold-duotone"
              className="text-orange-500 text-xl shrink-0"
            />
            <p className="text-[10px] text-orange-200/70 leading-relaxed font-medium uppercase tracking-wider">
              Funds moved from the Vault to the Terminal will be liquid. Ensure
              your 2FA hardware is active for external withdrawals.
            </p>
          </div>

          {/* ACTION BUTTONS */}
          <div className="flex flex-col gap-3">
            <button
              onClick={() => {
                toast.success("Protocol Initiated: Assets moved to Terminal");
                setActiveModal(null);
              }}
              className="w-full bg-primary text-white py-5 rounded-[22px] font-black text-sm uppercase tracking-[0.2em] shadow-[0_15px_30px_rgba(20,184,166,0.3)] hover:scale-[1.02] transition-all"
            >
              Confirm Re-allocation
            </button>
            <button
              onClick={() => setActiveModal(null)}
              className="w-full py-4 text-slate-500 font-black text-[10px] uppercase tracking-widest hover:text-white transition-colors"
            >
              Abort Sequence
            </button>
          </div>
        </div>
      )}

      {/* --- ELITE AI ASSISTANT (FIXED POSITIONING) --- */}
      <div
        className={`fixed bottom-8 right-8 z-[1000] flex flex-col items-end transition-all duration-700 ${isAiOpen ? "w-[350px] md:w-[450px]" : "w-16"}`}
      >
        {isAiOpen && (
          <div className="relative group bg-[#0D0D0D] w-full h-[600px] rounded-[40px] border border-white/10 shadow-[0_0_100px_rgba(20,184,166,0.2)] overflow-hidden flex flex-col mb-4 animate-in zoom-in-90 slide-in-from-bottom-20">
            {/* Rotating Lightning Border */}
            <div
              className="absolute inset-0 bg-gradient-to-r from-primary via-blue-500 to-primary opacity-20 animate-spin-slow pointer-events-none"
              style={{ margin: "-100%", padding: "100%" }}
            />

            <div className="relative bg-[#0D0D0D] m-[1px] rounded-[39px] flex-1 flex flex-col overflow-hidden">
              <div className="p-6 bg-gradient-to-r from-primary to-blue-600 text-white flex justify-between items-center shadow-2xl">
                <div className="flex items-center gap-3">
                  <Icon
                    icon="solar:magic-stick-3-bold"
                    className="text-2xl animate-pulse"
                  />
                  <div>
                    <p className="font-black text-xs uppercase tracking-widest">
                      Neural AI
                    </p>
                    <p className="text-[10px] opacity-70">
                      Synchronized with Markets
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsAiOpen(false)}
                  className="hover:scale-125 transition-transform"
                >
                  <Icon icon="solar:close-circle-bold" className="text-2xl" />
                </button>
              </div>

              <div className="flex-1 p-6 overflow-y-auto space-y-6 scrollbar-hide">
                {aiMessages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`max-w-[85%] p-5 rounded-[25px] text-sm leading-relaxed ${
                      msg.role === "user"
                        ? "bg-primary text-white self-end rounded-tr-none shadow-xl"
                        : "bg-white/5 text-slate-200 self-start rounded-tl-none border border-white/5 shadow-inner"
                    }`}
                  >
                    {msg.text}
                  </div>
                ))}
              </div>

              <div className="p-6 bg-white/5 backdrop-blur-3xl border-t border-white/5 flex gap-3">
                <input
                  type="text"
                  value={aiInput}
                  onChange={(e) => setAiInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                  placeholder="Command AI..."
                  className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-xs text-white outline-none focus:border-primary transition-all"
                />
                <button
                  onClick={handleSendMessage}
                  className="bg-primary text-white p-4 rounded-2xl shadow-lg shadow-primary/20 hover:scale-110 active:scale-95 transition-all"
                >
                  <Icon icon="solar:plain-bold" className="text-xl" />
                </button>
              </div>
            </div>
          </div>
        )}
        <button
          onClick={() => setIsAiOpen(!isAiOpen)}
          className={`relative p-5 rounded-full shadow-[0_10px_40px_rgba(20,184,166,0.4)] transition-all duration-500 overflow-hidden group ${isAiOpen ? "bg-slate-900 rotate-180" : "bg-primary"}`}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <Icon
            icon={
              isAiOpen ? "solar:close-square-bold" : "solar:magic-stick-3-bold"
            }
            className="text-3xl text-white relative z-10"
          />
        </button>
      </div>

      {/* MODALS */}
      {activeModal && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/90 backdrop-blur-md"
            onClick={() => setActiveModal(null)}
          />
          <div className="bg-white dark:bg-[#0D0D0D] w-full max-w-md rounded-[45px] p-10 relative z-10 animate-in zoom-in-95 border border-white/5">
            <button
              className="absolute right-8 top-8 text-slate-400 hover:text-primary transition-colors"
              onClick={() => setActiveModal(null)}
            >
              <Icon icon="solar:close-circle-bold" className="text-3xl" />
            </button>
            {activeModal === "buy" && (
              <BuyCrypto
                balance={availableBalance}
                lockedBalance={lockedBalance}
                onSuccess={() => setActiveModal(null)}
              />
            )}
            {activeModal === "sell" && (
              <SellCrypto
                balance={availableBalance}
                lockedBalance={lockedBalance}
                onSuccess={() => setActiveModal(null)}
              />
            )}
            {activeModal === "deposit" && (
              <DepositForm
                onClose={() => setActiveModal(null)}
                onSuccess={(b) => {
                  setBalance(b);
                  setActiveModal(null);
                }}
              />
            )}
            {activeModal === "withdraw" && (
              <WithdrawForm
                onClose={() => setActiveModal(null)}
                availableBalance={availableBalance}
                onSuccess={(b) => {
                  setBalance(b);
                  setActiveModal(null);
                }}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
};;;

// Sub-components with Premium Styles
const NavItem = ({ icon, label, active = false }: any) => (
  <div
    className={`flex items-center gap-4 p-4 rounded-2xl cursor-pointer transition-all duration-300 ${active ? "bg-primary text-white shadow-xl shadow-primary/20 translate-x-1" : "text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5"}`}
  >
    <Icon icon={icon} className="text-2xl" />
    <span className="font-black hidden lg:block text-sm uppercase tracking-tighter">
      {label}
    </span>
  </div>
);

const ActionButton = ({ icon, label, color, onClick }: any) => (
  <button onClick={onClick} className="flex flex-col items-center gap-3 group">
    <div
      className={`${color} p-5 rounded-[22px] text-white group-hover:scale-110 transition-all shadow-xl shadow-black/10`}
    >
      <Icon icon={icon} className="text-2xl" />
    </div>
    <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">
      {label}
    </span>
  </button>
);

const WatchItem = ({ symbol, name, price, change, up }: any) => (
  <div className="flex items-center justify-between p-6 rounded-[30px] bg-slate-50 dark:bg-white/5 border border-transparent hover:border-primary/20 transition-all cursor-pointer group">
    <div className="flex items-center gap-4">
      <div className="w-12 h-12 rounded-2xl bg-white dark:bg-[#121212] shadow-sm flex items-center justify-center font-black text-xs text-primary">
        {symbol[0]}
      </div>
      <div>
        <p className="font-black text-sm tracking-tight">{symbol}</p>
        <p className="text-[10px] text-slate-500 font-bold">{name}</p>
      </div>
    </div>
    <div className="text-right">
      <p className="font-black text-sm">${price}</p>
      <div
        className={`flex items-center justify-end text-[10px] font-black ${up ? "text-green-500" : "text-red-500"}`}
      >
        <Icon
          icon={
            up ? "solar:arrow-right-up-bold" : "solar:arrow-right-down-bold"
          }
        />
        {change}
      </div>
    </div>
  </div>
);

export default Dashboard;

"use client";

import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import Link from "next/link";
import { CSVLink } from "react-csv";
import { Icon } from "@iconify/react";
import { getTeslaAnalysis } from "@/app/actions"; 
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
  const [profile, setProfile] = useState<any>(null);
const [isAiLoading, setIsAiLoading] = useState(false);
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

  // Logic: Vault Release (Preserved)
  const handleVaultRelease = async () => {
    const loadingToast = toast.loading("Executing Re-allocation...", {
      style: {
        background: "#0D0D0D",
        color: "#fff",
        border: "1px solid rgba(20, 184, 166, 0.2)",
      },
    });
    try {
      const { error } = await supabase.rpc("initiate_vault_transfer", {
        user_id_param: user.id,
      });
      toast.dismiss(loadingToast);
      if (error) throw error;
      toast.success("Protocol Success: Assets Unlocked", { icon: "🔓" });
      fetchAll(user.id);
      setActiveModal(null);
    } catch (err) {
      toast.dismiss(loadingToast);
      toast.error("System Exception: Handshake Interrupted");
    }
  };

  const handleSendMessage = async () => {
    if (!aiInput.trim() || isAiLoading) return;

    const userMsgText = aiInput;
    setAiInput("");
    setIsAiLoading(true); // Ensure you have an isLoading state specifically for AI if needed

    // 1. Add User Message to UI
    const userMsg = { role: "user" as const, text: userMsgText };
    setAiMessages((prev) => [...prev, userMsg]);

    try {
    const formattedMessages = aiMessages.map((m) => ({
        role: m.role === "user" ? "user" : "assistant",
        content: m.text,
      }));

      // Add the latest message to the array
      formattedMessages.push({ role: "user", content: userMsgText });

      // 3. Call the REAL Server Action
      const result = await getTeslaAnalysis(formattedMessages as any);

      if (result.success) {
        setAiMessages((prev) => [
          ...prev,
          {
            role: "system", // Keep "system" or "ai" based on your Dashboard's CSS
            text:
              result.message || "Neural Handshake complete. No data returned.",
          },
        ]);

        toast.success("Neural Signal Decrypted", {
          icon: "📡",
          style: {
            background: "#0D0D0D",
            color: "#14b8a6",
            border: "1px solid #14b8a6",
          },
        });
      } else {
        throw new Error("Link Failed");
      }
    } catch (err) {
      setAiMessages((prev) => [
        ...prev,
        {
          role: "system",
          text: "CRITICAL ERROR: NEURAL LINK DISCONNECTED. Protocol 404: Mainframe Unreachable.",
        },
      ]);
      toast.error("System Exception: Handshake Interrupted");
    } finally {
      setIsAiLoading(false);
    }
  };
  useEffect(() => {
    if (!user) return;
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

  const availableBalance = Math.max(0, balance - lockedBalance);

  if (loading)
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-white dark:bg-[#050505]">
        <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-4"></div>
        <p className="text-[10px] font-black uppercase tracking-[0.5em] text-primary animate-pulse">
          Initializing Terminal
        </p>
      </div>
    );

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#050505] text-slate-900 dark:text-white transition-colors duration-500 overflow-x-hidden">
      {/* --- DESKTOP SIDEBAR --- */}
      <aside className="fixed left-0 top-0 h-full w-20 lg:w-64 bg-white dark:bg-[#0D0D0D]/80 backdrop-blur-xl border-r border-slate-200 dark:border-white/5 hidden md:flex flex-col items-center py-8 z-50">
        <div className="mb-10 text-primary font-black text-2xl hidden lg:block tracking-tighter italic">
          TESLA<span className="text-slate-400 font-light">X</span>
        </div>
        <div className="flex flex-col gap-3 w-full px-4">
          <Link href="/">
            <NavItem icon="solar:home-2-bold-duotone" label="Home" />
          </Link>
          <NavItem icon="solar:widget-bold" label="Dashboard" active />
          <Link
            href="https://tesla-stockbox.vercel.app"
            className="flex items-center gap-4 p-4 rounded-2xl text-slate-400 hover:bg-primary/10 hover:text-primary transition-all"
          >
            <Icon icon="solar:graph-up-bold" className="text-2xl" />
            <span className="font-bold hidden lg:block text-sm uppercase">
              Markets
            </span>
          </Link>
          <Link
            href="/dashboard/vault"
            className="flex items-center gap-4 p-4 rounded-2xl text-slate-400 hover:bg-primary/10 hover:text-primary transition-all"
          >
            <Icon icon="solar:safe-2-bold" className="text-2xl" />
            <span className="font-bold hidden lg:block text-sm uppercase">
              The Vault
            </span>
          </Link>
          <Link
            href="/profile"
            className="flex items-center gap-4 p-4 rounded-2xl text-slate-400 hover:bg-primary/10 hover:text-primary transition-all"
          >
            <Icon icon="solar:settings-bold" className="text-2xl" />
            <span className="font-bold hidden lg:block text-sm uppercase">
              Settings
            </span>
          </Link>
        </div>
        <div className="mt-auto flex flex-col items-center gap-6">
          <button
            onClick={toggleTheme}
            className="p-3 rounded-xl bg-slate-100 dark:bg-white/5 text-primary"
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
            <img
              src={profile?.profile_pic_url || "/default-avatar.jpg"}
              className="w-12 h-12 rounded-full border-2 border-primary object-cover shadow-xl"
            />
          </Link>
        </div>
      </aside>

      {/* --- MOBILE NAV --- */}
      <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[92%] max-w-sm h-18 bg-white/90 dark:bg-[#111]/90 backdrop-blur-3xl border border-white/20 dark:border-white/5 rounded-[32px] flex items-center justify-around px-4 z-[9999] md:hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
        <Link href="/">
          <Icon
            icon="solar:home-2-bold-duotone"
            className="text-2xl text-slate-400"
          />
        </Link>
        <Link href="https://tesla-stockbox.vercel.app">
          <Icon
            icon="solar:graph-up-bold"
            className="text-2xl text-slate-400"
          />
        </Link>
        <div
          onClick={() => setActiveModal("deposit")}
          className="w-14 h-14 bg-primary rounded-full flex items-center justify-center -translate-y-6 shadow-2xl shadow-primary/40 border-[6px] border-[#F8FAFC] dark:border-[#050505]"
        >
          <Icon icon="solar:add-circle-bold" className="text-2xl text-white" />
        </div>
        <Link href="/dashboard/vault">
          <Icon icon="solar:safe-2-bold" className="text-2xl text-slate-400" />
        </Link>
        <Link href="/profile">
          <Icon
            icon="solar:settings-bold"
            className="text-2xl text-slate-400"
          />
        </Link>
      </nav>

      {/* --- MAIN CONTENT --- */}
      <main className="md:ml-20 lg:ml-64 p-4 md:p-10 pb-32">
        <header className="flex justify-between items-center mb-12">
          <div>
            <h1 className="text-3xl md:text-5xl font-black tracking-tighter italic uppercase text-slate-900 dark:text-white">
              ELITE ACCESS:{" "}
              <span className="text-primary">
                {profile?.full_name || "TRADER"}
              </span>
            </h1>
            <div className="flex items-center gap-2 mt-2">
              <span className="w-2 h-2 bg-primary rounded-full animate-ping" />
              <p className="text-primary font-bold text-[10px] uppercase tracking-[0.3em]">
                Institutional Protocol Active
              </p>
            </div>
          </div>
          <button
            onClick={() => setActiveModal("deposit")}
            className="hidden md:flex items-center gap-3 bg-primary px-8 py-4 rounded-2xl text-white font-black text-xs uppercase tracking-widest hover:scale-105 transition-all shadow-2xl shadow-primary/30"
          >
            <Icon icon="solar:wallet-money-bold" className="text-xl" /> Add
            Funds
          </button>
        </header>

        {/* --- BALANCES GRID --- */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          <div className="lg:col-span-2 bg-[#0A0A0A] p-10 md:p-14 rounded-[50px] border border-white/5 relative overflow-hidden group">
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-6 opacity-50">
                <Icon
                  icon="solar:globus-bold"
                  className="text-primary animate-spin-slow"
                />
                <span className="text-white text-[10px] font-black uppercase tracking-[0.4em]">
                  Global Equity Index
                </span>
              </div>
              <h2 className="text-6xl md:text-8xl font-black text-white italic tracking-tighter mb-12">
                $
                {balance.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                })}
              </h2>
              <div className="flex flex-wrap gap-6">
                <div className="bg-white/5 backdrop-blur-md p-6 rounded-[32px] border border-white/10 min-w-[180px]">
                  <p className="text-white/30 text-[10px] font-bold uppercase mb-2 tracking-widest">
                    Available
                  </p>
                  <p className="text-2xl font-black text-green-400">
                    ${availableBalance.toLocaleString()}
                  </p>
                </div>
                <div className="bg-white/5 backdrop-blur-md p-6 rounded-[32px] border border-white/10 min-w-[180px]">
                  <p className="text-white/30 text-[10px] font-bold uppercase mb-2 tracking-widest">
                    Escrowed
                  </p>
                  <p className="text-2xl font-black text-orange-400">
                    ${lockedBalance.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
            <div className="absolute -top-24 -right-24 w-96 h-96 bg-primary opacity-10 blur-[120px] rounded-full group-hover:opacity-20 transition-opacity" />
          </div>

          <div className="bg-white dark:bg-[#0D0D0D] border dark:border-white/5 p-10 rounded-[50px] shadow-2xl flex flex-col justify-center gap-10">
            <div className="grid grid-cols-2 gap-8">
              <ActionButton
                icon="solar:card-recive-bold-duotone"
                label="Deposit"
                color="bg-primary"
                onClick={() => setActiveModal("deposit")}
              />
              <ActionButton
                icon="solar:card-send-bold-duotone"
                label="Withdraw"
                color="bg-slate-800"
                onClick={() => setActiveModal("withdraw")}
              />
              <ActionButton
                icon="solar:cart-large-2-bold-duotone"
                label="Buy"
                color="bg-primary"
                onClick={() => setActiveModal("buy")}
              />
              <ActionButton
                icon="solar:tag-price-bold-duotone"
                label="Sell"
                color="bg-slate-800"
                onClick={() => setActiveModal("sell")}
              />
            </div>
          </div>
        </div>

        {/* --- PERFORMANCE & AI NEURAL MAP --- */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 mb-12">
          <section className="bg-white dark:bg-[#0D0D0D] border dark:border-white/5 rounded-[50px] p-10 shadow-xl">
            <h3 className="font-black text-[11px] uppercase tracking-[0.4em] mb-10 text-slate-400">
              Live Asset Tracking
            </h3>
            <div className="space-y-6">
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

          <div className="bg-[#050505] rounded-[50px] p-10 border border-white/5 relative overflow-hidden group">
            <div className="flex justify-between items-center mb-8 relative z-10">
              <h3 className="text-white font-black text-[11px] uppercase tracking-[0.4em] flex items-center gap-3">
                <Icon
                  icon="solar:plain-bold"
                  className="text-primary animate-pulse"
                />
                Neural Liquidity Map
              </h3>
              <span className="text-[9px] font-black text-primary/50 uppercase tracking-widest border border-primary/20 px-2 py-1 rounded">
                V4.2 Secure
              </span>
            </div>

            <div className="grid grid-cols-8 gap-2 relative z-10">
              {[...Array(40)].map((_, i) => (
                <div
                  key={i}
                  className={`h-6 rounded-md transition-all duration-500 ${i % 7 === 0 ? "bg-primary shadow-[0_0_15px_rgba(20,184,166,0.6)]" : "bg-white/5"}`}
                  style={{
                    animationDelay: `${i * 50}ms`,
                    opacity: Math.random() * 0.5 + 0.3,
                  }}
                />
              ))}
            </div>

            <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-transparent to-transparent z-20 flex flex-col items-center justify-end pb-10 px-6 text-center">
              <div className="backdrop-blur-xl bg-white/5 border border-white/10 p-6 rounded-[30px] w-full transform group-hover:scale-[1.02] transition-transform">
                <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-4">
                  Neural Link Status:{" "}
                  <span className="text-orange-500">Awaiting Assets</span>
                </p>
                <button
                  onClick={() => setActiveModal("deposit")}
                  className="w-full py-4 bg-primary text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] shadow-xl shadow-primary/20"
                >
                  Sync Neural Mainnet
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* --- LEDGER HISTORY --- */}
        <section className="bg-white dark:bg-[#0D0D0D] border dark:border-white/5 rounded-[50px] overflow-hidden shadow-2xl">
          <div className="p-10 border-b dark:border-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
            <div>
              <h3 className="font-black text-2xl italic tracking-tighter">
                TRANSACTION LEDGER
              </h3>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">
                Institutional Grade Audit Log
              </p>
            </div>
            <CSVLink
              data={transactions}
              filename="tesla-x-ledger.csv"
              className="flex items-center gap-3 bg-slate-100 dark:bg-white/5 px-6 py-3 rounded-2xl text-[10px] font-black uppercase text-slate-500 hover:text-primary transition-all"
            >
              <Icon icon="solar:cloud-download-bold" className="text-lg" />{" "}
              Export Terminal Data
            </CSVLink>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.01]">
                  <th className="px-10 py-6">Event Type</th>
                  <th className="px-10 py-6">Asset Class</th>
                  <th className="px-10 py-6">Quantum</th>
                  <th className="px-10 py-6">Status</th>
                  <th className="px-10 py-6 text-right">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y dark:divide-white/5">
                {transactions.length > 0 ? (
                  transactions.map((tx) => (
                    <tr
                      key={tx.id}
                      className="hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors group"
                    >
                      <td className="px-10 py-6">
                        <div className="flex items-center gap-4">
                          <div
                            className={`p-3 rounded-xl ${tx.type === "deposit" || tx.type === "buy" ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"}`}
                          >
                            <Icon
                              icon={
                                tx.type === "deposit"
                                  ? "solar:import-bold"
                                  : tx.type === "withdraw"
                                    ? "solar:export-bold"
                                    : "solar:transfer-horizontal-bold"
                              }
                              className="text-lg"
                            />
                          </div>
                          <span className="font-black text-xs uppercase tracking-tight">
                            {tx.type}
                          </span>
                        </div>
                      </td>
                      <td className="px-10 py-6 font-bold text-sm text-slate-600 dark:text-slate-300">
                        {tx.asset}
                      </td>
                      <td className="px-10 py-6 font-mono font-bold text-lg tracking-tighter">
                        ${tx.amount.toLocaleString()}
                      </td>
                      <td className="px-10 py-6">
                        <span
                          className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${tx.status === "completed" ? "border-green-500/20 text-green-500 bg-green-500/5" : "border-orange-500/20 text-orange-500 bg-orange-500/5"}`}
                        >
                          {tx.status}
                        </span>
                      </td>
                      <td className="px-10 py-6 text-right text-slate-400 text-xs font-mono">
                        {new Date(tx.created_at).toLocaleString()}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-10 py-24 text-center text-slate-500 font-bold uppercase text-[11px] tracking-[0.5em] opacity-30 italic"
                    >
                      System Idle: No Data Detected
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>

      {/* --- AI ASSISTANT OVERLAY --- */}
      <div
        className={`fixed bottom-8 right-8 z-[1000] flex flex-col items-end transition-all duration-700 ${isAiOpen ? "w-[350px] md:w-[450px]" : "w-16"}`}
      >
        {isAiOpen && (
          <div className="relative bg-[#0D0D0D] w-full h-[600px] rounded-[40px] border border-white/10 shadow-2xl flex flex-col mb-4 overflow-hidden animate-in zoom-in-95">
            <div className="p-6 bg-primary text-white flex justify-between items-center">
              <div className="flex items-center gap-3">
                <Icon
                  icon="solar:magic-stick-3-bold"
                  className="text-2xl animate-pulse"
                />
                <span className="font-black text-xs uppercase tracking-widest">
                  Neural AI
                </span>
              </div>
              <button onClick={() => setIsAiOpen(false)}>
                <Icon icon="solar:close-circle-bold" className="text-2xl" />
              </button>
            </div>
            <div className="flex-1 p-6 overflow-y-auto space-y-4">
              {aiMessages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`p-4 rounded-2xl text-sm ${
                    msg.role === "user"
                      ? "bg-primary text-white ml-auto rounded-tr-none"
                      : "bg-white/5 text-slate-300 mr-auto rounded-tl-none border border-white/5"
                  }`}
                >
                  {msg.text}
                </div>
              ))}
              {/* REAL-TIME LOADING INDICATOR */}
              {isAiLoading && (
                <div className="bg-white/5 text-primary p-4 rounded-2xl rounded-tl-none border border-primary/20 w-24 flex gap-1 animate-pulse">
                  <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce"></span>
                  <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                  <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                </div>
              )}
            </div>
            <div className="p-4 bg-white/5 border-t border-white/5 flex gap-2">
              <input
                type="text"
                value={aiInput}
                onChange={(e) => setAiInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                placeholder="What do you want..."
                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs text-white outline-none focus:border-primary transition-all"
              />
              <button
                onClick={handleSendMessage}
                className="bg-primary text-white p-3 rounded-xl"
              >
                <Icon icon="solar:plain-bold" />
              </button>
            </div>
          </div>
        )}
        <button
          onClick={() => setIsAiOpen(!isAiOpen)}
          className="p-5 rounded-full bg-primary shadow-2xl hover:scale-110 transition-transform"
        >
          <Icon
            icon={
              isAiOpen ? "solar:close-square-bold" : "solar:magic-stick-3-bold"
            }
            className="text-3xl text-white"
          />
        </button>
      </div>

      {/* --- MODAL ENGINE --- */}
      {activeModal && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/95 backdrop-blur-xl"
            onClick={() => setActiveModal(null)}
          />
          <div className="bg-white dark:bg-[#0D0D0D] w-full max-w-md rounded-[50px] p-10 relative z-10 animate-in zoom-in-95 border border-white/10 shadow-2xl">
            <button
              className="absolute right-8 top-8 text-slate-400 hover:text-primary"
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
};

// Sub-components
const NavItem = ({ icon, label, active = false }: any) => (
  <div
    className={`flex items-center gap-4 p-4 rounded-2xl cursor-pointer transition-all duration-300 ${active ? "bg-primary text-white shadow-xl shadow-primary/20" : "text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5"}`}
  >
    <Icon icon={icon} className="text-2xl" />
    <span className="font-black hidden lg:block text-sm uppercase tracking-tighter">
      {label}
    </span>
  </div>
);

const ActionButton = ({ icon, label, color, onClick }: any) => (
  <button
    onClick={onClick}
    className="flex flex-col items-center gap-3 group transition-transform active:scale-95"
  >
    <div
      className={`${color} p-6 rounded-[28px] text-white group-hover:scale-110 transition-all shadow-xl shadow-black/20`}
    >
      <Icon icon={icon} className="text-3xl" />
    </div>
    <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">
      {label}
    </span>
  </button>
);

const WatchItem = ({ symbol, name, price, change, up }: any) => (
  <div className="flex items-center justify-between p-6 rounded-[32px] bg-slate-50 dark:bg-white/5 border border-transparent hover:border-primary/20 transition-all cursor-pointer group">
    <div className="flex items-center gap-5">
      <div className="w-12 h-12 rounded-2xl bg-white dark:bg-[#121212] flex items-center justify-center font-black text-xs text-primary shadow-inner">
        {symbol[0]}
      </div>
      <div>
        <p className="font-black text-sm tracking-tight">{symbol}</p>
        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter">
          {name}
        </p>
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
          className="mr-1"
        />
        {change}
      </div>
    </div>
  </div>
);

export default Dashboard;

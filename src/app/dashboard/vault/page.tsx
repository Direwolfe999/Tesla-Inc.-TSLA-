"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Icon } from "@iconify/react";
import Link from "next/link";
import toast from "react-hot-toast";

const VaultPage = () => {
  const [balance, setBalance] = useState(0);
  const [lockedBalance, setLockedBalance] = useState(0);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);

  const fetchVaultData = async (userId: string) => {
    setLoading(true);
    const [walletRes, profileRes, transRes] = await Promise.all([
      supabase.from("wallets").select("*").eq("user_id", userId).single(),
      supabase.from("profiles").select("*").eq("id", userId).single(),
      supabase
        .from("transactions")
        .select("*")
        .eq("user_id", userId)
        .eq("asset", "VAULT_RELEASE")
        .order("created_at", { ascending: false }),
    ]);

    if (walletRes.data) {
      setBalance(Number(walletRes.data.balance));
      setLockedBalance(Number(walletRes.data.locked_balance || 0));
    }
    if (profileRes.data) setProfile(profileRes.data);
    if (transRes.data) setTransactions(transRes.data);

    setLoading(false);
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        setUser(data.session.user);
        fetchVaultData(data.session.user.id);
      }
    });
  }, []);

  // --- INTEGRATED LOGIC ---

  const handleTransferInitiation = () => {
    if (lockedBalance <= 0) {
      toast.error("No secured assets found in Vault");
      return;
    }

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

    setTimeout(() => {
      toast.dismiss("vault-protocol");
      setActiveModal("vault-transfer");
    }, 2000);
  };

  const handleVaultRelease = async () => {
    const loadingToast = toast.loading("Executing Re-allocation...");

    const { error } = await supabase.rpc("initiate_vault_transfer", {
      user_id_param: user.id,
    });

    toast.dismiss(loadingToast);

    if (error) {
      toast.error("Protocol Failed: Security Intercepted");
    } else {
      toast.success("Protocol Success: Assets Unlocked");
      fetchVaultData(user.id);
      setActiveModal(null);
    }
  };

  if (loading)
    return (
      <div className="h-screen w-full flex items-center justify-center bg-[#050505]">
        <div className="relative">
          <div className="w-20 h-20 border-2 border-primary/20 rounded-full animate-ping"></div>
          <Icon
            icon="solar:safe-2-bold-duotone"
            className="absolute top-5 left-5 text-4xl text-primary animate-pulse"
          />
        </div>
      </div>
    );

  return (
    <div className="min-h-screen bg-[#050505] text-white p-4 md:p-10 relative">
      {/* HEADER */}
      <header className="flex justify-between items-center mb-12">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors group"
        >
          <Icon
            icon="solar:alt-arrow-left-bold-duotone"
            className="text-2xl group-hover:-translate-x-1 transition-transform"
          />
          <span className="text-xs font-black uppercase tracking-widest">
            Back to Terminal
          </span>
        </Link>
        <div className="text-right">
          <p className="text-[10px] font-black text-primary uppercase tracking-[0.4em]">
            Security Level
          </p>
          <p className="text-sm font-bold text-white uppercase italic">
            Tier 4 Access
          </p>
        </div>
      </header>

      {/* MAIN VAULT DISPLAY */}
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 relative overflow-hidden bg-gradient-to-br from-[#0D0D0D] to-[#050505] border border-white/5 rounded-[50px] p-10 shadow-[0_50px_100px_-20px_rgba(0,0,0,1)] group">
          <div className="absolute top-[-50px] right-[-50px] opacity-[0.02] group-hover:opacity-[0.05] transition-opacity duration-1000">
            <Icon
              icon="solar:shield-check-bold-duotone"
              className="text-[500px] text-primary"
            />
          </div>

          <div className="relative z-10">
            <div className="flex items-center gap-4 mb-10">
              <div className="w-16 h-16 bg-primary/10 rounded-3xl flex items-center justify-center border border-primary/20 shadow-[0_0_30px_rgba(20,184,166,0.2)]">
                <Icon
                  icon="solar:safe-2-bold-duotone"
                  className="text-3xl text-primary animate-spin-slow"
                />
              </div>
              <div>
                <h1 className="text-3xl font-black tracking-tighter uppercase italic">
                  Secure Vault
                </h1>
                <p className="text-slate-500 text-[10px] font-bold tracking-[0.3em] uppercase">
                  Time-Locked Equity Storage
                </p>
              </div>
            </div>

            <div className="mb-16">
              <span className="text-white/30 text-[10px] font-black uppercase tracking-[0.5em]">
                Total Secured Value
              </span>
              <div className="flex items-baseline gap-4 mt-2">
                <h2 className="text-6xl md:text-8xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white to-slate-600 italic">
                  ${lockedBalance.toLocaleString()}
                </h2>
                <span className="text-primary font-black animate-pulse text-sm uppercase">
                  Protected
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <VaultStat
                label="Yield Generation"
                value="12.4% APY"
                icon="solar:chart-2-bold-duotone"
                color="text-green-400"
              />
              <VaultStat
                label="Unlock Schedule"
                value="T+48 Cycles"
                icon="solar:history-bold-duotone"
                color="text-blue-400"
              />
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-[#0D0D0D] border border-white/5 rounded-[40px] p-8">
            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-6">
              Security Protocol
            </h3>
            <div className="space-y-4">
              <SecurityCheck label="Biometric Sync" active />
              <SecurityCheck label="End-to-End Encryption" active />
              <SecurityCheck label="Neural Link Status" active />
              <SecurityCheck label="Cold Storage Node" active />
            </div>
          </div>

          <div
            onClick={handleTransferInitiation}
            className="bg-primary p-8 rounded-[40px] shadow-[0_20px_40px_rgba(20,184,166,0.3)] group cursor-pointer hover:scale-[1.02] active:scale-95 transition-all"
          >
            <div className="flex justify-between items-start mb-6">
              <Icon
                icon="solar:lock-keyhole-minimalistic-bold-duotone"
                className="text-4xl text-white"
              />
              <Icon
                icon="solar:round-alt-arrow-right-bold-duotone"
                className="text-2xl text-white/50 group-hover:translate-x-2 transition-transform"
              />
            </div>
            <h4 className="text-xl font-black italic uppercase leading-tight text-white">
              Initiate <br /> Asset Transfer
            </h4>
            <p className="text-white/60 text-xs mt-2 font-bold uppercase tracking-widest">
              Withdrawal Protocol
            </p>
          </div>
        </div>
      </div>

      {/* --- AUDIT TRAIL --- */}
      <div className="mt-12 bg-[#0D0D0D] border border-white/5 rounded-[40px] overflow-hidden">
        <div className="p-8 border-b border-white/5 flex justify-between items-center">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">
            Audit Trail
          </h3>
          <Icon
            icon="solar:document-list-bold-duotone"
            className="text-primary text-xl"
          />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-[10px] font-black text-slate-600 uppercase tracking-widest border-b border-white/5">
                <th className="px-8 py-6">Event</th>
                <th className="px-8 py-6">Status</th>
                <th className="px-8 py-6 text-right">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {transactions
                .filter((t) => t.asset === "VAULT_RELEASE")
                .map((tx) => (
                  <tr
                    key={tx.id}
                    className="group hover:bg-white/[0.02] transition-colors"
                  >
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <Icon
                            icon="solar:unlock-bold-duotone"
                            className="text-primary text-sm"
                          />
                        </div>
                        <span className="text-sm font-bold">
                          Security Release
                        </span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <span className="text-[9px] font-black bg-green-500/10 text-green-500 px-3 py-1 rounded-full uppercase italic">
                        Cleared
                      </span>
                    </td>
                    <td className="px-8 py-6 text-right text-slate-500 text-xs font-medium">
                      {new Date(tx.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              {transactions.filter((t) => t.asset === "VAULT_RELEASE")
                .length === 0 && (
                <tr>
                  <td
                    colSpan={3}
                    className="px-8 py-12 text-center text-slate-600 text-xs font-bold uppercase tracking-widest"
                  >
                    No recent vault activity detected.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- MODAL SYSTEM --- */}
      {activeModal === "vault-transfer" && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/90 backdrop-blur-md"
            onClick={() => setActiveModal(null)}
          />
          <div className="bg-[#0D0D0D] w-full max-w-md rounded-[45px] p-10 relative z-10 border border-white/10 animate-in zoom-in-95">
            <div className="flex flex-col items-center mb-8 text-center">
              <div className="relative w-24 h-24 mb-6">
                <div className="absolute inset-0 border-2 border-primary/20 rounded-full animate-ping"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <Icon
                    icon="solar:fingerprint-bold-duotone"
                    className="text-5xl text-primary"
                  />
                </div>
              </div>
              <h3 className="text-2xl font-black italic uppercase italic">
                Biometric Verified
              </h3>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.3em] mt-2">
                Authorization Complete
              </p>
            </div>

            <div className="bg-white/5 border border-white/10 p-6 rounded-[30px] mb-8">
              <div className="flex justify-between items-center mb-2">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                  Releasing Assets
                </span>
                <Icon
                  icon="solar:lock-unlock-bold-duotone"
                  className="text-primary"
                />
              </div>
              <p className="text-3xl font-black italic">
                ${lockedBalance.toLocaleString()}
              </p>
            </div>

            <button
              onClick={handleVaultRelease}
              className="w-full bg-primary text-white py-5 rounded-[22px] font-black text-sm uppercase tracking-[0.2em] shadow-xl hover:scale-105 transition-all mb-4"
            >
              Confirm Re-allocation
            </button>
            <button
              onClick={() => setActiveModal(null)}
              className="w-full text-slate-500 font-black text-[10px] uppercase tracking-widest hover:text-white transition-colors"
            >
              Abort Protocol
            </button>
          </div>
        </div>
      )}

      <footer className="mt-20 border-t border-white/5 pt-10 text-center text-[9px] font-black text-slate-600 uppercase tracking-[1em]">
        Tesla-X Institutional Vault System © 2026
      </footer>
    </div>
  );
};

const VaultStat = ({ label, value, icon, color }: any) => (
  <div className="bg-white/5 border border-white/5 p-6 rounded-[30px] hover:bg-white/10 transition-colors">
    <div className="flex items-center gap-3 mb-2">
      <Icon icon={icon} className={`${color} text-xl`} />
      <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
        {label}
      </span>
    </div>
    <p className="text-2xl font-black italic">{value}</p>
  </div>
);

const SecurityCheck = ({ label, active }: any) => (
  <div className="flex items-center justify-between">
    <span className="text-[11px] font-bold text-slate-400">{label}</span>
    <div className="flex items-center gap-2">
      <span className="text-[9px] font-black text-primary uppercase">
        Active
      </span>
      <div className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse shadow-[0_0_10px_rgba(20,184,166,1)]"></div>
    </div>
  </div>
);

export default VaultPage;

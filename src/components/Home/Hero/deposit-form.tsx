"use client";
import { useState } from "react";
import toast from "react-hot-toast";
import { supabase } from "@/lib/supabaseClient";
import {
  X,
  DollarSign,
  ArrowUpCircle,
  Loader2,
  ShieldCheck,
} from "lucide-react";

interface DepositFormProps {
  onClose: () => void;
  onSuccess?: (newBalance: number) => void;
}

const DepositForm = ({ onClose, onSuccess }: DepositFormProps) => {
  const [amount, setAmount] = useState<string>("");
  const [loading, setLoading] = useState(false);

  // --- LOGIC PRESERVED ---
  const ensureWallet = async (userId: string) => {
    const { data, error } = await supabase
      .from("wallets")
      .select("id")
      .eq("user_id", userId)
      .single();

    if (error && error.code === "PGRST116") {
      const { error: insertError } = await supabase
        .from("wallets")
        .insert([{ user_id: userId, balance: 0 }]);
      if (insertError) throw insertError;
    } else if (error) {
      throw error;
    }
  };

  const handleDeposit = async () => {
    const amt = parseFloat(amount.replace("$", ""));
    if (!amt || amt <= 0) {
      toast.error("Enter a valid amount");
      return;
    }

    setLoading(true);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Please sign in");
        return;
      }

      const userId = session.user.id;
      await ensureWallet(userId);

      const { data, error } = await supabase.rpc("deposit_funds", {
        p_user_id: userId,
        p_amount: amt,
      });

      if (error) throw error;

      toast.success("Transaction Securely Processed");
      setAmount("");
      if (onSuccess && data?.new_balance !== undefined) {
        onSuccess(data.new_balance);
      }
      onClose();
    } catch (err: any) {
      toast.error(err.message || "Deposit failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative w-full max-w-md mx-auto bg-white dark:bg-[#0A0A0A] border border-slate-200 dark:border-white/10 rounded-3xl p-8 shadow-2xl overflow-visible">
      {/* Close Button - High Z-index */}
      <button
        onClick={onClose}
        className="absolute -top-3 -right-3 z-[110] bg-white dark:bg-slate-800 p-2 rounded-full shadow-xl border border-slate-200 dark:border-white/20 hover:scale-110 transition-transform"
      >
        <X className="w-5 h-5 text-slate-500 dark:text-slate-300" />
      </button>

      {/* Header */}
      <div className="mb-8 text-center">
        <div className="w-16 h-16 bg-primary/20 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-primary/30">
          <ArrowUpCircle className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
          Funding <span className="text-primary">Portal</span>
        </h2>
        <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">
          Instant Bank Wire
        </p>
      </div>

      <div className="space-y-6">
        {/* Amount Input */}
        <div className="space-y-2">
          <label className="text-[11px] font-black uppercase text-slate-500 ml-1">
            Deposit Amount (USD)
          </label>
          <div className="relative group">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-primary font-bold text-xl">
              <DollarSign className="w-6 h-6" />
            </div>
            <input
              type="text"
              value={amount ? `${amount}` : ""}
              onChange={(e) => setAmount(e.target.value.replace(/\$/g, ""))}
              placeholder="0.00"
              className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl pl-12 pr-4 py-5 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all dark:text-white font-mono text-2xl"
            />
          </div>
        </div>

        {/* Info Card */}
        <div className="flex items-start gap-3 p-4 bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-200 dark:border-white/5">
          <ShieldCheck className="w-5 h-5 text-primary mt-0.5" />
          <p className="text-[11px] text-slate-500 leading-relaxed font-medium">
            Funds are secured with 256-bit encryption. Deposits are usually
            available instantly but may take up to 2 minutes to reflect in your
            dashboard.
          </p>
        </div>

        {/* Buttons */}
        <div className="space-y-3">
          <button
            onClick={handleDeposit}
            disabled={loading}
            className="w-full bg-primary disabled:opacity-50 text-black font-black py-5 rounded-2xl transition-all transform hover:shadow-[0_0_20px_rgba(var(--primary-rgb),0.3)] active:scale-95 flex items-center justify-center gap-2 text-lg uppercase tracking-widest"
          >
            {loading ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : (
              "Complete Deposit"
            )}
          </button>

          <button
            onClick={onClose}
            className="w-full py-3 rounded-xl text-slate-500 font-bold text-sm uppercase tracking-widest hover:text-slate-700 dark:hover:text-white transition-colors"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};

export default DepositForm;

"use client";
import { useState } from "react";
import toast from "react-hot-toast";
import { supabase } from "@/lib/supabaseClient";
import {
  X,
  DollarSign,
  ArrowDownCircle,
  Loader2,
  AlertCircle,
} from "lucide-react";

interface WithdrawFormProps {
  availableBalance: number;
  onClose: () => void;
  onSuccess?: (newBalance: number) => void;
}

const WithdrawForm = ({
  availableBalance,
  onClose,
  onSuccess,
}: WithdrawFormProps) => {
  const [amount, setAmount] = useState<string>("");
  const [loading, setLoading] = useState(false);

  // --- LOGIC PRESERVED 100% ---
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

  const handleWithdraw = async () => {
    const amt = parseFloat(amount.replace("$", ""));
    if (!amt || amt <= 0) {
      toast.error("Enter a valid amount");
      return;
    }

    if (amt > availableBalance) {
      toast.error("Insufficient balance");
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

      const { data, error } = await supabase.rpc("withdraw_funds", {
        p_user_id: userId,
        p_amount: amt,
      });

      if (error) throw error;

      toast.success("Withdrawal Request Authorized");
      setAmount("");
      if (onSuccess && data?.new_balance !== undefined) {
        onSuccess(data.new_balance);
      }
      onClose();
    } catch (err: any) {
      toast.error(err.message || "Withdrawal failed");
    } finally {
      setLoading(false);
    }
  };

  const handleMax = () => {
    setAmount(availableBalance.toString());
  };

  return (
    <div className="relative w-full max-w-md mx-auto bg-white dark:bg-[#0A0A0A] border border-slate-200 dark:border-white/10 rounded-3xl p-8 shadow-2xl overflow-visible">
      {/* High-priority Cancel Button */}
      <button
        onClick={onClose}
        className="absolute -top-3 -right-3 z-[110] bg-white dark:bg-slate-800 p-2 rounded-full shadow-xl border border-slate-200 dark:border-white/20 hover:scale-110 transition-transform"
      >
        <X className="w-5 h-5 text-slate-500 dark:text-slate-300" />
      </button>

      {/* Header */}
      <div className="mb-8 text-center">
        <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-red-500/20">
          <ArrowDownCircle className="w-8 h-8 text-red-500" />
        </div>
        <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
          Withdraw <span className="text-red-500">Capital</span>
        </h2>
        <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">
          External Wallet Transfer
        </p>
      </div>

      <div className="space-y-6">
        {/* Available Display */}
        <div className="flex justify-between items-center px-4 py-3 bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-200 dark:border-white/5">
          <span className="text-xs font-bold text-slate-500 uppercase">
            Available for Payout
          </span>
          <span className="font-mono font-bold text-slate-900 dark:text-white">
            $
            {availableBalance.toLocaleString(undefined, {
              minimumFractionDigits: 2,
            })}
          </span>
        </div>

        {/* Amount Input */}
        <div className="space-y-2 relative">
          <label className="text-[11px] font-black uppercase text-slate-500 ml-1">
            Withdrawal Amount
          </label>
          <div className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-red-500 font-bold text-xl">
              <DollarSign className="w-6 h-6" />
            </div>
            <input
              type="text"
              value={amount ? `${amount}` : ""}
              onChange={(e) => setAmount(e.target.value.replace(/\$/g, ""))}
              placeholder="0.00"
              className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl pl-12 pr-16 py-5 focus:border-red-500/50 focus:ring-1 focus:ring-red-500/50 outline-none transition-all dark:text-white font-mono text-2xl"
            />
            <button
              type="button"
              onClick={handleMax}
              className="absolute right-4 top-1/2 -translate-y-1/2 bg-red-500/10 text-red-500 text-[10px] font-black px-2 py-1 rounded-md hover:bg-red-500 hover:text-white transition-all"
            >
              MAX
            </button>
          </div>
        </div>

        {/* Warning Box */}
        <div className="flex items-start gap-3 p-4 bg-red-500/5 rounded-2xl border border-red-500/10">
          <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 shrink-0" />
          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
            Please ensure your destination wallet address is correct. Authorized
            withdrawals are finalized within 24 hours for security audits.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <button
            onClick={handleWithdraw}
            disabled={loading}
            className="w-full bg-red-600 disabled:opacity-50 text-white font-black py-5 rounded-2xl transition-all transform hover:shadow-[0_0_20px_rgba(220,38,38,0.3)] active:scale-95 flex items-center justify-center gap-2 text-lg uppercase tracking-widest"
          >
            {loading ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : (
              "Authorize Withdrawal"
            )}
          </button>

          <button
            onClick={onClose}
            className="w-full py-2 rounded-xl text-slate-400 font-bold text-xs uppercase tracking-widest hover:text-slate-600 dark:hover:text-white transition-colors"
          >
            Cancel Request
          </button>
        </div>
      </div>
    </div>
  );
};

export default WithdrawForm;

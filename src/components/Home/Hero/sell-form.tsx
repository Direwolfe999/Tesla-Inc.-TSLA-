"use client";
import { useState, useEffect, useRef } from "react";
import toast from "react-hot-toast";
import { ChevronDown, Wallet, TrendingDown, Loader2, X } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import useCryptoPrices from "@/lib/useCryptoPrices";

interface Coin {
  symbol: string;
  name: string;
  price: number;
}

interface SellCryptoProps {
  balance: number;
  lockedBalance?: number;
  onSuccess?: () => void;
  onClose?: () => void;
}

const SellCrypto = ({
  balance,
  lockedBalance = 0,
  onSuccess,
  onClose,
}: SellCryptoProps) => {
  const [loading, setLoading] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const { coins, loading: coinsLoading } = useCryptoPrices();
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [formData, setFormData] = useState({
    name: "",
    symbol: "",
    price: 0,
    amount: "",
  });

  const availableBalance = Math.max(0, balance - lockedBalance);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setUser(session.user);
    });
  }, []);

  const handleDropdownSelect = (coin: Coin) => {
    setFormData((prev) => ({
      ...prev,
      name: coin.name,
      symbol: coin.symbol,
      price: coin.price || 0,
    }));
    setIsDropdownOpen(false);
  };

  const totalPrice = formData.amount
    ? Number(formData.amount) * formData.price
    : 0;

  // --- LOGIC PRESERVED ---
  const completeTransaction = async () => {
    if (!user) return;
    const tx = await supabase
      .from("transactions")
      .select("id")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (tx.data?.id) {
      await supabase.rpc("complete_transaction", { p_tx_id: tx.data.id });
      if (onSuccess) onSuccess();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return toast.error("Please sign in first");
    if (!formData.symbol) return toast.error("Select a coin");
    if (!formData.amount || Number(formData.amount) <= 0)
      return toast.error("Enter a valid amount");

    // Note: In a real app, you'd check if they have enough of the ASSET,
    // but I'm keeping your balance check logic as requested.
    if (totalPrice > availableBalance)
      return toast.error("Insufficient available balance");

    setLoading(true);

    try {
      const { error } = await supabase.rpc("sell_crypto", {
        p_user_id: user.id,
        p_asset: formData.symbol,
        p_amount: Number(formData.amount),
        p_price: formData.price,
        p_min_receive: Number(formData.amount) * formData.price * 0.95,
      });

      if (error) throw error;

      toast.success(`${formData.name} sell order placed!`);
      setFormData((prev) => ({ ...prev, amount: "" }));

      setTimeout(() => completeTransaction(), 2000);
    } catch (err: any) {
      toast.error(err.message || "Sell failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative w-full max-w-md mx-auto bg-white dark:bg-[#0A0A0A] border border-slate-200 dark:border-white/10 rounded-3xl p-6 backdrop-blur-xl shadow-2xl overflow-visible">
      {/* CANCEL BUTTON */}
      {onClose && (
        <button
          onClick={onClose}
          className="absolute -top-2 -right-2 z-[110] bg-white dark:bg-slate-800 p-2 rounded-full shadow-lg border border-slate-200 dark:border-white/20 hover:scale-110 transition-transform"
        >
          <X className="w-5 h-5 text-slate-500 dark:text-slate-300" />
        </button>
      )}

      {/* Header */}
      <div className="flex justify-between items-center mb-8 pr-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            Sell <span className="text-amber-500">Asset</span>
          </h2>
          <p className="text-xs text-slate-500 font-medium uppercase tracking-tighter">
            Liquidate Position
          </p>
        </div>
        <div className="text-right">
          <div className="flex items-center justify-end text-[10px] text-slate-500 uppercase font-bold mb-1">
            <Wallet className="w-3 h-3 mr-1" /> Portfolio
          </div>
          <p className="font-mono font-bold text-amber-500 text-lg">
            $
            {availableBalance.toLocaleString(undefined, {
              minimumFractionDigits: 2,
            })}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <label className="text-[11px] font-bold uppercase tracking-widest text-slate-500 mb-2 block ml-1">
            Asset to Sell
          </label>
          <button
            type="button"
            onClick={() => !coinsLoading && setIsDropdownOpen(!isDropdownOpen)}
            className="w-full flex items-center justify-between bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl px-4 py-4 transition-all hover:border-amber-500/50 group"
          >
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center mr-3 border border-amber-500/20">
                <span className="text-amber-500 font-bold">
                  {formData.symbol ? formData.symbol[0] : "?"}
                </span>
              </div>
              <span className="font-bold text-slate-900 dark:text-white">
                {formData.name ||
                  (coinsLoading ? "Fetching..." : "Select Asset")}
              </span>
            </div>
            <ChevronDown
              className={`w-5 h-5 text-slate-400 transition-transform ${isDropdownOpen ? "rotate-180" : ""}`}
            />
          </button>

          {isDropdownOpen && (
            <div className="absolute z-[100] w-full mt-2 bg-white dark:bg-[#111111] border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl max-h-60 overflow-y-auto">
              {coins.map((coin) => (
                <div
                  key={coin.symbol}
                  onClick={() => handleDropdownSelect(coin)}
                  className="px-4 py-3 hover:bg-amber-500/10 cursor-pointer flex justify-between items-center group transition-colors"
                >
                  <div className="flex flex-col">
                    <span className="font-bold text-sm dark:text-white group-hover:text-amber-500 transition-colors">
                      {coin.name}
                    </span>
                    <span className="text-[10px] text-slate-500 uppercase">
                      {coin.symbol}
                    </span>
                  </div>
                  <span className="text-sm text-amber-500 font-mono font-bold">
                    ${coin.price?.toLocaleString() ?? "0.00"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Input Group */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-[11px] font-bold uppercase text-slate-500 ml-1">
              Exit Price
            </label>
            <div className="bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl px-4 py-3 font-mono text-slate-500 text-sm">
              ${formData.price?.toLocaleString() ?? "0.00"}
            </div>
          </div>
          <div className="space-y-2 relative">
            <label className="text-[11px] font-bold uppercase text-slate-500 ml-1">
              Amount
            </label>
            <input
              type="number"
              placeholder="0.00"
              value={formData.amount}
              onChange={(e) =>
                setFormData({ ...formData, amount: e.target.value })
              }
              className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl px-4 py-3 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none transition-all dark:text-white font-mono"
            />
          </div>
        </div>

        {/* Total Return Card */}
        <div className="bg-slate-50 dark:bg-white/5 rounded-2xl p-4 border border-dashed border-slate-200 dark:border-white/10">
          <div className="flex justify-between items-center text-sm">
            <span className="text-slate-500 font-medium uppercase text-[10px] tracking-widest">
              Estimated Return
            </span>
            <span className="font-mono font-black text-amber-500 text-xl">
              $
              {totalPrice.toLocaleString(undefined, {
                minimumFractionDigits: 2,
              })}
            </span>
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading || !formData.symbol}
          className="w-full group relative overflow-hidden bg-amber-500 disabled:opacity-50 text-black font-black py-4 rounded-2xl transition-all transform active:scale-95 shadow-[0_0_20px_rgba(245,158,11,0.2)]"
        >
          <span className="relative z-10 flex items-center justify-center gap-2 tracking-tighter text-lg">
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <TrendingDown className="w-6 h-6" />
            )}
            {loading ? "PROCESSING..." : "CONFIRM SELL"}
          </span>
          <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
        </button>
      </form>
    </div>
  );
};

export default SellCrypto;

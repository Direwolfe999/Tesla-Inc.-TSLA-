"use client";
import { useState, useEffect, useRef } from "react";
import toast from "react-hot-toast";
import { ChevronDown, Wallet, Zap, Loader2, X } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import useCryptoPrices from "@/lib/useCryptoPrices";

interface Coin {
  symbol: string;
  name: string;
  price: number;
}

interface BuyCryptoProps {
  balance: number;
  lockedBalance?: number;
  onSuccess?: () => void;
  onClose?: () => void; // Prop to handle closing the modal
}

const BuyCrypto = ({
  balance,
  lockedBalance = 0,
  onSuccess,
  onClose,
}: BuyCryptoProps) => {
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

  const handleMax = () => {
    if (formData.price > 0) {
      const maxAmount = (availableBalance / formData.price).toFixed(6);
      setFormData((prev) => ({ ...prev, amount: maxAmount }));
    }
  };

  const totalCost = formData.amount
    ? Number(formData.amount) * formData.price
    : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return toast.error("Please sign in");
    if (!formData.symbol) return toast.error("Select an asset");
    if (totalCost > availableBalance) return toast.error("Insufficient funds");

    setLoading(true);
    try {
      const { error } = await supabase.rpc("buy_crypto", {
        p_user_id: user.id,
        p_asset: formData.symbol,
        p_amount: Number(formData.amount),
        p_price: formData.price,
        p_max_slippage: 1.05,
      });

      if (error) throw error;
      toast.success(`Position opened: ${formData.amount} ${formData.symbol}`);
      setFormData((prev) => ({ ...prev, amount: "" }));
      if (onSuccess) onSuccess();
    } catch (err: any) {
      toast.error(err.message || "Execution failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative w-full max-w-md mx-auto bg-white dark:bg-[#0A0A0A] border border-slate-200 dark:border-white/10 rounded-3xl p-6 backdrop-blur-xl shadow-2xl overflow-visible">
      {/* CANCEL BUTTON - Higher Z-Index and Relative positioning */}
      {onClose && (
        <button
          onClick={onClose}
          className="absolute -top-2 -right-2 z-[110] bg-white dark:bg-slate-800 p-2 rounded-full shadow-lg border border-slate-200 dark:border-white/20 hover:scale-110 transition-transform"
        >
          <X className="w-5 h-5 text-slate-500 dark:text-slate-300" />
        </button>
      )}

      {/* Header Info */}
      <div className="flex justify-between items-center mb-8 pr-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            Buy Asset
          </h2>
          <p className="text-xs text-slate-500 font-medium uppercase tracking-tighter">
            Instant Execution
          </p>
        </div>
        <div className="text-right">
          <div className="flex items-center justify-end text-[10px] text-slate-500 uppercase font-bold mb-1">
            <Wallet className="w-3 h-3 mr-1" /> Balance
          </div>
          <p className="font-mono font-bold text-primary text-lg">
            $
            {availableBalance.toLocaleString(undefined, {
              minimumFractionDigits: 2,
            })}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Asset Selector */}
        <div className="relative" ref={dropdownRef}>
          <label className="text-[11px] font-bold uppercase tracking-widest text-slate-500 mb-2 block ml-1">
            Instrument
          </label>
          <button
            type="button"
            onClick={() => !coinsLoading && setIsDropdownOpen(!isDropdownOpen)}
            className="w-full flex items-center justify-between bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl px-4 py-4 transition-all hover:border-primary/50 group"
          >
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center mr-3 border border-primary/20">
                <span className="text-primary font-bold">
                  {formData.symbol ? formData.symbol[0] : "?"}
                </span>
              </div>
              <span className="font-bold text-slate-900 dark:text-white">
                {formData.name || (coinsLoading ? "Syncing..." : "Select Coin")}
              </span>
            </div>
            <ChevronDown
              className={`w-5 h-5 text-slate-400 transition-transform ${isDropdownOpen ? "rotate-180" : ""}`}
            />
          </button>

          {isDropdownOpen && (
            <div className="absolute z-[100] w-full mt-2 bg-white dark:bg-[#111111] border border-slate-200 dark:border-white/10 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] max-h-60 overflow-y-auto overflow-x-hidden">
              {coins.map((coin) => (
                <div
                  key={coin.symbol}
                  onClick={() => handleDropdownSelect(coin)}
                  className="px-4 py-3 hover:bg-slate-50 dark:hover:bg-primary/10 cursor-pointer flex justify-between items-center group transition-colors"
                >
                  <div className="flex flex-col">
                    <span className="font-bold text-sm dark:text-white group-hover:text-primary transition-colors">
                      {coin.name}
                    </span>
                    <span className="text-[10px] text-slate-500 uppercase">
                      {coin.symbol}
                    </span>
                  </div>
                  <span className="text-sm text-primary font-mono font-bold">
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
              Price
            </label>
            <div className="bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl px-4 py-3 font-mono text-slate-500 text-sm">
              ${formData.price?.toLocaleString() ?? "0.00"}
            </div>
          </div>
          <div className="space-y-2 relative">
            <label className="text-[11px] font-bold uppercase text-slate-500 ml-1">
              Amount
            </label>
            <div className="relative">
              <input
                type="number"
                placeholder="0.00"
                value={formData.amount}
                onChange={(e) =>
                  setFormData({ ...formData, amount: e.target.value })
                }
                className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl px-4 py-3 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all dark:text-white font-mono"
              />
              <button
                type="button"
                onClick={handleMax}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] font-black bg-primary text-black px-1.5 py-0.5 rounded hover:scale-105 transition-transform"
              >
                MAX
              </button>
            </div>
          </div>
        </div>

        {/* Summary Card */}
        <div className="bg-slate-50 dark:bg-white/5 rounded-2xl p-4 border border-dashed border-slate-200 dark:border-white/10">
          <div className="flex justify-between items-center text-sm">
            <span className="text-slate-500 font-medium uppercase text-[10px] tracking-widest">
              Total Investment
            </span>
            <span className="font-mono font-black dark:text-white text-xl">
              $
              {totalCost.toLocaleString(undefined, {
                minimumFractionDigits: 2,
              })}
            </span>
          </div>
        </div>

        {/* Action Button */}
        <button
          type="submit"
          disabled={loading || !formData.symbol}
          className="w-full group relative overflow-hidden bg-primary disabled:opacity-50 text-black font-black py-4 rounded-2xl transition-all transform active:scale-95 shadow-[0_0_20px_rgba(var(--primary-rgb),0.2)]"
        >
          <span className="relative z-10 flex items-center justify-center gap-2 tracking-tighter text-lg">
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Zap className="w-6 h-6 fill-current" />
            )}
            {loading ? "PROCESSING..." : "CONFIRM PURCHASE"}
          </span>
          <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
        </button>
      </form>
    </div>
  );
};

export default BuyCrypto;

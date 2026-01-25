"use client";
import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import Logo from "@/components/Layout/Header/Logo";
import { supabase } from "@/lib/supabaseClient";
import useCryptoPrices from "@/lib/useCryptoPrices";

interface Coin {
  symbol: string;
  name: string;
  price: number;
}

interface BuyCryptoProps {
  balance: number; // available balance
  lockedBalance?: number; // optional
  onSuccess?: () => void;
}

const BuyCrypto = ({
  balance,
  lockedBalance = 0,
  onSuccess,
}: BuyCryptoProps) => {
  const [loading, setLoading] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [user, setUser] = useState<any>(null);

  const [formData, setFormData] = useState({
    name: "",
    symbol: "",
    price: 0,
    amount: "",
  });

  const { coins, loading: coinsLoading } = useCryptoPrices();

  // Update modal balance dynamically
  const [availableBalance, setAvailableBalance] = useState(balance);
  useEffect(() => {
    setAvailableBalance(Math.max(0, balance - lockedBalance));
  }, [balance, lockedBalance]);

  // ---------------- AUTH ----------------
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) return toast.error("Please sign in first");
      setUser(session.user);
    });
  }, []);

  // ---------------- DROPDOWN ----------------
  const handleDropdownSelect = (coin: Coin) => {
    setFormData((prev) => ({
      ...prev,
      name: coin.name,
      symbol: coin.symbol,
      price: coin.price,
    }));
    setIsDropdownOpen(false);
  };

  // ---------------- AMOUNT INPUT ----------------
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\$/g, "");
    if (/^\d*\.?\d*$/.test(value)) {
      setFormData((prev) => ({ ...prev, amount: value }));
    }
  };

  const totalCost = formData.amount
    ? Number(formData.amount) * formData.price
    : 0;

  // ---------------- WALLET ENSURE ----------------
  const ensureWallet = async (userId: string) => {
    const { data, error } = await supabase
      .from("wallets")
      .select("id")
      .eq("user_id", userId)
      .single();

    if (error?.code === "PGRST116") {
      const { error: insertError } = await supabase
        .from("wallets")
        .insert([{ user_id: userId, balance: 0 }]);
      if (insertError) throw insertError;
    } else if (error) throw error;
  };

  // ---------------- COMPLETE TRANSACTION ----------------
  const completeTransaction = async () => {
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

  // ---------------- SUBMIT ----------------
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) return toast.error("Please sign in");
    if (!formData.symbol) return toast.error("Select a coin");
    if (!formData.amount || Number(formData.amount) <= 0)
      return toast.error("Enter a valid amount");

    if (totalCost > availableBalance)
      return toast.error("Insufficient available balance");

    setLoading(true);

    try {
      await ensureWallet(user.id);

      const { error } = await supabase.rpc("buy_crypto", {
        p_user_id: user.id,
        p_asset: formData.symbol,
        p_amount: Number(formData.amount),
        p_price: formData.price,
        p_max_slippage: 1.05,
      });

      if (error) throw error;

      toast.success(`${formData.name} purchase pending!`);
      setFormData((prev) => ({ ...prev, amount: "" }));

      // auto complete transaction after 2 seconds
      setTimeout(() => completeTransaction(), 2000);
    } catch (err: any) {
      toast.error(err.message || "Purchase failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-4">
      <div className="flex justify-center mb-16">
        <Logo />
      </div>

      <div className="mb-4 text-white">
        <p>Wallet Balance: {availableBalance.toFixed(2)}</p>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Dropdown */}
        <div className="mb-4 relative">
          <div
            onClick={() => !coinsLoading && setIsDropdownOpen((prev) => !prev)}
            className={`cursor-pointer text-white bg-transparent border border-dark_border border-opacity-60 rounded-md px-3 py-2 flex justify-between items-center ${
              coinsLoading ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            {formData.name ||
              (coinsLoading ? "Loading coins..." : "Select asset")}
            <span>{isDropdownOpen ? "▲" : "▼"}</span>
          </div>

          {isDropdownOpen && (
            <div className="absolute z-10 bg-dark border border-dark_border border-opacity-60 mt-1 rounded-md w-full max-h-48 overflow-y-auto">
              {coinsLoading ? (
                <div className="px-3 py-2 text-white">Loading coins...</div>
              ) : (
                coins.map((coin) => (
                  <div
                    key={coin.symbol}
                    onClick={() => handleDropdownSelect(coin)}
                    className="px-3 py-2 bg-dark_grey text-white hover:bg-primary hover:text-darkmode cursor-pointer"
                  >
                    {coin.name}
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Price */}
        <div className="mb-4">
          <input
            type="text"
            value={formData.price.toFixed(2)}
            disabled
            className="text-white bg-transparent border border-dark_border border-opacity-60 rounded-md px-3 py-2 w-full"
          />
        </div>

        {/* Amount */}
        <div className="mb-4">
          <input
            type="text"
            name="amount"
            placeholder="0.00"
            value={formData.amount}
            onChange={handleChange}
            className="text-white bg-transparent border border-dark_border border-opacity-60 rounded-md px-3 py-2 w-full"
          />
        </div>

        {/* Total */}
        <div className="flex justify-between mb-4 text-white">
          <p>Total Cost:</p>
          <p>{totalCost.toFixed(2)}</p>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="text-darkmode font-medium text-18 bg-primary w-full border border-primary rounded-lg py-3 hover:bg-transparent hover:text-primary"
        >
          {loading ? "Processing..." : "Buy"}
        </button>
      </form>
    </div>
  );
};

export default BuyCrypto;

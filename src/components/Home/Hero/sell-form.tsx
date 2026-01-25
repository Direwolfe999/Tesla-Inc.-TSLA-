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

interface SellCryptoProps {
  balance: number; // available balance
  lockedBalance?: number;
  onSuccess?: () => void;
}

const SellCrypto = ({
  balance,
  lockedBalance = 0,
  onSuccess,
}: SellCryptoProps) => {
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

  const [availableBalance, setAvailableBalance] = useState(balance);
  useEffect(() => {
    setAvailableBalance(Math.max(0, balance - lockedBalance));
  }, [balance, lockedBalance]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) return toast.error("Please sign in first");
      setUser(session.user);
    });
  }, []);

  const handleDropdownSelect = (coin: Coin) => {
    setFormData((prev) => ({
      ...prev,
      name: coin.name,
      symbol: coin.symbol,
      price: coin.price,
    }));
    setIsDropdownOpen(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\$/g, "");
    if (/^\d*\.?\d*$/.test(value)) {
      setFormData((prev) => ({ ...prev, amount: value }));
    }
  };

  const totalPrice = formData.amount
    ? Number(formData.amount) * formData.price
    : 0;

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

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) return toast.error("Please sign in first");
    if (!formData.symbol) return toast.error("Select a coin");
    if (!formData.amount || Number(formData.amount) <= 0)
      return toast.error("Enter a valid amount");

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

      toast.success(`${formData.name} sell pending!`);
      setFormData((prev) => ({ ...prev, amount: "" }));

      setTimeout(() => completeTransaction(), 2000);
    } catch (err: any) {
      toast.error(err.message || "Sell failed");
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
          <p>Total Price:</p>
          <p>{totalPrice.toFixed(2)}</p>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="font-medium text-18 w-full border border-primary rounded-lg py-3 text-primary hover:bg-primary hover:text-darkmode"
        >
          {loading ? "Processing..." : "Sell"}
        </button>
      </form>
    </div>
  );
};

export default SellCrypto;

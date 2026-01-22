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
  balance: number; // ✅ comes from Dashboard (single source of truth)
}

const BuyCrypto = ({ balance }: BuyCryptoProps) => {
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

  /* ---------------- AUTH ---------------- */
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        toast.error("Please sign in first");
        return;
      }
      setUser(session.user);
    });
  }, []);

  /* ---------------- HANDLERS ---------------- */
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
    const { name, value } = e.target;
    if (name === "amount") {
      setFormData((prev) => ({ ...prev, amount: value }));
    }
  };

  const totalCost = formData.amount
    ? (formData.price * Number(formData.amount)).toFixed(2)
    : "0.00";

  /* ---------------- WALLET ENSURE ---------------- */
  const ensureWallet = async (userId: string) => {
    const { error } = await supabase
      .from("wallets")
      .select("id")
      .eq("user_id", userId)
      .single();

    if (error?.code === "PGRST116") {
      const { error: insertError } = await supabase
        .from("wallets")
        .insert([{ user_id: userId, balance: 0 }]);
      if (insertError) throw insertError;
    } else if (error) {
      throw error;
    }
  };

  /* ---------------- SUBMIT ---------------- */
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!user) return toast.error("Please sign in first");
    if (!formData.symbol) return toast.error("Select a coin");
    if (!formData.amount || Number(formData.amount) <= 0)
      return toast.error("Enter a valid amount");

    const total = formData.price * Number(formData.amount);
    if (balance < total) return toast.error("Insufficient wallet balance");

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

      toast.success(`${formData.name} purchased successfully!`);
      setFormData((prev) => ({ ...prev, amount: "" }));
      // ✅ DO NOT update balance here — realtime handles it
    } catch (err: any) {
      toast.error(err.message || "Purchase failed");
    } finally {
      setLoading(false);
    }
  };

  /* ---------------- UI ---------------- */
  return (
    <div className="max-w-md mx-auto p-4">
      <div className="flex justify-center mb-16">
        <Logo />
      </div>

      <div className="mb-4 text-white">
        <p>Wallet Balance: ${balance.toLocaleString()}</p>
      </div>

      <form onSubmit={handleSubmit}>
        {/* ---------- DROPDOWN ---------- */}
        <div className="mb-4 relative">
          <div
            onClick={() => {
              if (!coinsLoading) setIsDropdownOpen((prev) => !prev);
            }}
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
              ) : coins.length > 0 ? (
                coins.map((coin) => (
                  <div
                    key={coin.symbol}
                    onClick={() => handleDropdownSelect(coin)}
                    className="px-3 py-2 bg-dark_grey text-white hover:bg-primary hover:text-darkmode cursor-pointer"
                  >
                    {coin.name}
                  </div>
                ))
              ) : (
                <div className="px-3 py-2 text-white">No coins available</div>
              )}
            </div>
          )}
        </div>

        {/* ---------- PRICE ---------- */}
        <div className="mb-4">
          <input
            type="text"
            value={`$${formData.price.toLocaleString()}`}
            disabled
            className="text-white bg-transparent border border-dark_border border-opacity-60 rounded-md px-3 py-2 w-full"
          />
        </div>

        {/* ---------- AMOUNT ---------- */}
        <div className="mb-4">
          <input
            type="number"
            name="amount"
            placeholder="Amount"
            value={formData.amount}
            onChange={handleChange}
            min="0"
            className="text-white bg-transparent border border-dark_border border-opacity-60 rounded-md px-3 py-2 w-full"
            required
          />
        </div>

        {/* ---------- TOTAL ---------- */}
        <div className="flex justify-between mb-4 text-white">
          <p>Total Cost:</p>
          <p>${totalCost}</p>
        </div>

        {/* ---------- SUBMIT ---------- */}
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

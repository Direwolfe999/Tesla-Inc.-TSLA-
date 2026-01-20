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

const SellCrypto = () => {
  const [loading, setLoading] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [walletBalance, setWalletBalance] = useState(0);

  const [formData, setFormData] = useState({
    name: "",
    symbol: "",
    price: 0,
    amount: "",
  });

  // ✅ FIX: Correct hook usage
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

  /* ---------------- WALLET ---------------- */
  useEffect(() => {
    if (!user?.id) return;

    supabase
      .from("wallets")
      .select("balance")
      .eq("user_id", user.id)
      .single()
      .then(({ data }) => {
        if (data) setWalletBalance(data.balance);
      });
  }, [user]);

  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel("wallet-updates")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "wallets" },
        (payload: any) => {
          if (payload.new.user_id === user.id) {
            setWalletBalance(payload.new.balance);
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

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

  const totalPrice = formData.amount
    ? (formData.price * Number(formData.amount)).toFixed(2)
    : "0.00";

  /* ---------------- SUBMIT ---------------- */
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!user) return toast.error("Please sign in first");
    if (!formData.symbol) return toast.error("Select a coin");
    if (!formData.amount || Number(formData.amount) <= 0)
      return toast.error("Enter a valid amount");

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

      toast.success(`${formData.name} sold successfully!`);
      setFormData((prev) => ({ ...prev, amount: "" }));
    } catch (err: any) {
      toast.error(err.message || "Sell failed");
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
        <p>Wallet Balance: ${walletBalance.toLocaleString()}</p>
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
          <p>Total Price:</p>
          <p>${totalPrice}</p>
        </div>

        {/* ---------- SUBMIT ---------- */}
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

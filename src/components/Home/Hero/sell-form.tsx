import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import Logo from "@/components/Layout/Header/Logo";
import { supabase } from "@/lib/supabaseClient";
import  useCryptoPrices from "@/lib/useCryptoPrices";

interface Coin {
  symbol: string;
  name: string;
  price: number;
}

const SellCrypto = () => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<{
    name: string;
    symbol: string;
    price: number;
    amount: string;
  }>({
    name: "",
    symbol: "",
    price: 0,
    amount: "",
  });
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [walletBalance, setWalletBalance] = useState(0);
  const coins = useCryptoPrices();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        toast.error("Please sign in first");
        return;
      }
      setUser(session.user);
    });
  }, []);

  useEffect(() => {
    if (user?.id) {
      supabase
        .from("wallets")
        .select("balance")
        .eq("user_id", user.id)
        .single()
        .then(({ data }) => {
          if (data) setWalletBalance(data.balance);
        });
    }
  }, [user]);

  useEffect(() => {
    if (!user?.id) return;
    const channel = supabase
      .channel("wallets")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "wallets" },
        (payload: any) => {
          if (payload.new.user_id === user.id) {
            setWalletBalance(payload.new.balance);
          }
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "amount" ? value : value,
    }));
  };

  const handleDropdownSelect = (coin: Coin) => {
    setFormData((prev) => ({
      ...prev,
      name: coin.name,
      symbol: coin.symbol,
      price: coin.price,
    }));
    setIsDropdownOpen(false);
  };

  const totalPrice = formData.amount
    ? (formData.price * parseFloat(formData.amount)).toFixed(2)
    : "0.00";

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) {
      toast.error("User not loaded yet");
      return;
    }
    const amountNum = Number(formData.amount);
    if (!amountNum || amountNum <= 0) {
      toast.error("Enter a valid amount to sell");
      return;
    }
    setLoading(true);
    const priceValue = parseFloat(formData.price.toString());
    try {
      const { error } = await supabase.rpc("sell_crypto", {
        p_user_id: user.id,
        p_asset: formData.symbol,
        p_amount: amountNum,
        p_price: priceValue,
        p_min_receive: amountNum * priceValue * 0.95,
      });
      if (error) throw error;
      toast.success("Crypto sold successfully!");
      setFormData((prev) => ({ ...prev, amount: "" }));
    } catch (err: any) {
      toast.error(err.message || "Sell failed");
      console.error(err);
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
        <p>Wallet Balance: ${walletBalance.toLocaleString()}</p>
      </div>
      <form onSubmit={handleSubmit}>
        <div className="mb-4 relative">
          <div
            onClick={() => setIsDropdownOpen((prev) => !prev)}
            className="cursor-pointer text-white bg-transparent border border-dark_border border-opacity-60 rounded-md px-3 py-2 text-start flex justify-between items-center"
          >
            {formData.name}
            <span className="ml-2">{isDropdownOpen ? "▲" : "▼"}</span>
          </div>
          {isDropdownOpen && (
            <div className="absolute z-10 bg-dark border border-dark_border border-opacity-60 mt-1 rounded-md w-full max-h-48 overflow-y-auto">
              {coins.length > 0 ? (
                coins.map((coin: Coin) => (
                  <div
                    key={coin.symbol}
                    onClick={() => handleDropdownSelect(coin)}
                    className="px-3 bg-dark_grey text-white hover:text-darkmode py-2 hover:bg-primary cursor-pointer"
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
        <div className="mb-4">
          <input
            type="text"
            name="price"
            className="text-white bg-transparent border border-dark_border border-opacity-60 rounded-md px-3 py-2 w-full focus:border-primary focus-visible:outline-0"
            value={`$${formData.price.toLocaleString()}`}
            disabled
            required
          />
        </div>
        <div className="mb-4">
          <input
            type="number"
            name="amount"
            placeholder="Amount"
            value={formData.amount || 0}
            onChange={handleChange}
            min="0"
            required
            className="text-white bg-transparent border border-dark_border border-opacity-60 rounded-md px-3 py-2 w-full focus:border-primary focus-visible:outline-0"
          />
        </div>
        <div className="flex justify-between mb-4 text-white">
          <p>Total Price: </p>
          <p>${formData.price * Number(formData.amount || 0)}</p>
        </div>
        <button
          type="submit"
          className="hover:text-darkmode font-medium text-18 bg-transparent w-full border border-primary rounded-lg py-3 text-primary hover:bg-primary"
          disabled={loading}
        >
          {loading ? "Processing..." : "Sell"}
        </button>
      </form>
    </div>
  );
};

export default SellCrypto;

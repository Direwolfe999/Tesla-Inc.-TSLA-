import { useState } from "react";
import toast from "react-hot-toast";
import { supabase } from "@/lib/supabaseClient";

interface WithdrawFormProps {
  currentBalance: number;
  onClose: () => void;
  onSuccess: (newBalance: number) => void;
}


const WithdrawForm = ({
  onClose,
  currentBalance,
  onSuccess,
}: WithdrawFormProps) => {
  const [amount, setAmount] = useState<number>(0);
  const [loading, setLoading] = useState(false);

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
    if (amount <= 0) {
      toast.error("Enter a valid amount");
      return;
    }

    if (amount > currentBalance) {
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

      const { error } = await supabase.rpc("withdraw_funds", {
        p_user_id: userId,
        p_amount: Number(amount),
      });

      if (error) throw error;

      onSuccess(currentBalance - Number(amount));
      toast.success("Withdrawal successful");
      setAmount(0);
      onClose();
    } catch (err: any) {
      toast.error(err.message || "Withdrawal failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Withdraw Funds</h2>
      <p>Current Balance: ${currentBalance.toFixed(2)}</p>

      <input
        type="text"
        value={amount === 0 ? "" : `$${amount}`}
        onChange={(e) => setAmount(Number(e.target.value.replace("$", "")))}
        placeholder="Enter amount"
        className="w-full p-3 rounded-lg bg-gray-700 text-white"
      />

      <button
        onClick={handleWithdraw}
        disabled={loading}
        className="bg-red-600 w-full py-3 rounded-lg text-white font-bold hover:bg-red-700"
      >
        {loading ? "Processing..." : "Withdraw"}
      </button>

      <button
        onClick={onClose}
        className="w-full py-2 rounded-lg border border-gray-500 hover:bg-gray-600"
      >
        Cancel
      </button>
    </div>
  );
};

export default WithdrawForm;

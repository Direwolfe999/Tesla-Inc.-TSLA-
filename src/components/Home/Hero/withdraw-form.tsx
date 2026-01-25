import { useState } from "react";
import toast from "react-hot-toast";
import { supabase } from "@/lib/supabaseClient";

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

      toast.success("Withdrawal successful");
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

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Withdraw Funds</h2>
      <p>Available: ${availableBalance.toFixed(2)}</p>

      <input
        type="text"
        value={amount ? `$${amount}` : ""}
        onChange={(e) => setAmount(e.target.value.replace(/\$/g, ""))}
        placeholder="$0.00"
        className="w-full p-3 rounded-lg bg-gray-700 text-white"
      />

      <button
        onClick={handleWithdraw}
        disabled={loading}
        className="bg-red-600 w-full py-3 rounded-lg text-white font-bold hover:bg-red-700 disabled:opacity-50"
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

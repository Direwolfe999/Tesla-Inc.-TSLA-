import { supabase } from "@/lib/supabaseClient";

export default async function handler(req, res) {
  const { id } = req.query;
  if (req.method === "DELETE") {
    // Cancel a price alert
    const { data, error } = await supabase
      .from("price_alerts")
      .update({ status: "cancelled" })
      .eq("id", id);
    if (error) {
      res.status(500).json({ error: "Failed to cancel price alert" });
    } else {
      res.status(200).json(data[0]);
    }
  } else {
    res.status(405).json({ error: "Method not allowed" });
  }
}

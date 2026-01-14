import { supabase } from "@/lib/supabaseClient";

export default async function handler(req, res) {
  if (req.method === "POST") {
    // Set a price alert
    const { userId, asset, targetPrice, alertType } = req.body;
    const { data, error } = await supabase
      .from("price_alerts")
      .insert([
        {
          user_id: userId,
          asset,
          target_price: targetPrice,
          alert_type: alertType,
        },
      ]);
    if (error) {
      res.status(500).json({ error: "Failed to set price alert" });
    } else {
      res.status(201).json(data[0]);
    }
  } else if (req.method === "GET") {
    // Get all price alerts for a user
    const { userId } = req.query;
    const { data, error } = await supabase
      .from("price_alerts")
      .select("*")
      .eq("user_id", userId);
    if (error) {
      res.status(500).json({ error: "Failed to fetch price alerts" });
    } else {
      res.status(200).json(data);
    }
  } else {
    res.status(405).json({ error: "Method not allowed" });
  }
}

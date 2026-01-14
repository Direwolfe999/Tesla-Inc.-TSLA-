import { supabase } from "@/lib/supabaseClient";
import cron from "node-cron";

cron.schedule("* * * * *", async () => {
  try {
    // Fetch latest prices
    const prices = await fetchPrices();

    // Check if any price alerts need to be triggered
    const { data: alerts, error } = await supabase
      .from("price_alerts")
      .select("*")
      .eq("status", "active");

    if (error) {
      console.error(error);
    } else {
      alerts.forEach((alert) => {
        const currentPrice = prices[alert.asset];
        if (currentPrice !== undefined) {
          if (
            alert.alert_type === "buy" &&
            currentPrice <= alert.target_price
          ) {
            // Trigger notification
            triggerNotification(alert);
          } else if (
            alert.alert_type === "sell" &&
            currentPrice >= alert.target_price
          ) {
            // Trigger notification
            triggerNotification(alert);
          }
        } else {
          console.log(`No price found for ${alert.asset}`);
        }
      });
    }
  } catch (error) {
    console.error(error);
  }
});

async function fetchPrices() {
  try {
    // Fetch latest prices from API
    const response = await fetch("https://api.example.com/prices");
    const data = await response.json();
    return data;
  } catch (error) {
    console.error(error);
    return {};
  }
}

async function triggerNotification(alert) {
  try {
    // Send in-app notification to user
    const { data: user, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", alert.user_id)
      .single();

    if (error) {
      console.error(error);
    } else {
      // Send notification to user
      console.log(`Sending notification to ${user.username}`);
    }
  } catch (error) {
    console.error(error);
  }
}

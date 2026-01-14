import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function PriceAlertSettings() {
  const [priceAlertEnabled, setPriceAlertEnabled] = useState(false);
  const [priceAlerts, setPriceAlerts] = useState([]);

  useEffect(() => {
    const fetchPriceAlerts = async () => {
      const { data, error } = await supabase
        .from("price_alerts")
        .select("*")
        .eq("user_id", supabase.auth.user().id);
      if (error) {
        console.error(error);
      } else {
        setPriceAlerts(data);
        setPriceAlertEnabled(data.length > 0);
      }
    };
    fetchPriceAlerts();
  }, []);

  const handleTogglePriceAlert = async () => {
    if (priceAlertEnabled) {
      // Disable price alert
      await supabase
        .from("price_alerts")
        .update({ status: "cancelled" })
        .eq("user_id", supabase.auth.user().id);
      setPriceAlertEnabled(false);
    } else {
      // Enable price alert
      setPriceAlertEnabled(true);
    }
  };

  return (
    <div>
      <h2>Price Alert Settings</h2>
      <label>
        <input
          type="checkbox"
          checked={priceAlertEnabled}
          onChange={handleTogglePriceAlert}
        />
        Enable Price Alert
      </label>
      {priceAlertEnabled && (
        <div>
          <h3>Price Alerts</h3>
          <ul>
            {priceAlerts.map((alert) => (
              <li key={alert.id}>
                {alert.asset} - {alert.target_price} - {alert.alert_type}
              </li>
            ))}
          </ul>
          <PriceAlertForm />
        </div>
      )}
    </div>
  );
}

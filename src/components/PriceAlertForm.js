import { useState } from "react";

export default function PriceAlertForm() {
  const [asset, setAsset] = useState("");
  const [targetPrice, setTargetPrice] = useState("");
  const [alertType, setAlertType] = useState("buy");

  const handleSubmit = async (e) => {
    e.preventDefault();
    const response = await fetch("/api/price-alerts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ asset, targetPrice, alertType }),
    });
    const data = await response.json();
    console.log(data);
  };

  return (
    <form onSubmit={handleSubmit}>
      <label>
        Asset:
        <input
          type="text"
          value={asset}
          onChange={(e) => setAsset(e.target.value)}
        />
      </label>
      <label>
        Target Price:
        <input
          type="number"
          value={targetPrice}
          onChange={(e) => setTargetPrice(e.target.value)}
        />
      </label>
      <label>
        Alert Type:
        <select
          value={alertType}
          onChange={(e) => setAlertType(e.target.value)}
        >
          <option value="buy">Buy</option>
          <option value="sell">Sell</option>
        </select>
      </label>
      <button type="submit">Set Price Alert</button>
    </form>
  );
}

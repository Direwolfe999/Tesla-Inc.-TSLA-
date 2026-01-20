import { useEffect, useState } from "react";
import axios from "axios";
import { supabase } from "@/lib/supabaseClient";

interface Coin {
  symbol: string;
  name: string;
  price: number;
}

interface CacheData {
  timestamp: number;
  coins: Coin[];
}

const CACHE_KEY = "crypto_prices_cache";
const CACHE_TTL = 3 * 60 * 1000; // 3 minutes

const CRYPTO_IDS = [
  "bitcoin",
  "ethereum",
  "cardano",
  "polkadot",
  "solana",
  "dogecoin",
  "avalanche-2",
  "chainlink",
  "litecoin",
  "matic-network",
  "shiba-inu",
];

const STOCK_SYMBOLS = ["AAPL", "MSFT", "NVDA", "JPM", "V", "PYPL", "TSLA"];
const ALPHA_VANTAGE_API_KEY = "HBWKBIE9AIF6IQMO";

const useCryptoPrices = () => {
  const [coins, setCoins] = useState<Coin[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPrices = async () => {
    setLoading(true);

    try {
      /* ---------- CACHE ---------- */
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const parsed: CacheData = JSON.parse(cached);
        if (Date.now() - parsed.timestamp < CACHE_TTL) {
          setCoins(parsed.coins);
          setLoading(false);
          return;
        }
      }

      /* ---------- CRYPTO ---------- */
      const { data: cryptoData } = await axios.get(
        "https://api.coingecko.com/api/v3/coins/markets",
        {
          params: {
            vs_currency: "usd",
            ids: CRYPTO_IDS.join(","),
          },
        }
      );

      const cryptoCoins: Coin[] = cryptoData.map((coin: any) => ({
        symbol: `${coin.symbol.toUpperCase()}/USD`,
        name: coin.name,
        price: coin.current_price,
      }));

      /* ---------- STOCKS ---------- */
      const stockCoins: Coin[] = await Promise.all(
        STOCK_SYMBOLS.map(async (symbol) => {
          try {
            const { data } = await axios.get(
              "https://www.alphavantage.co/query",
              {
                params: {
                  function: "GLOBAL_QUOTE",
                  symbol,
                  apikey: ALPHA_VANTAGE_API_KEY,
                },
              }
            );

            const quote = data?.["Global Quote"];
            if (!quote?.["05. price"]) throw new Error("Invalid response");

            return {
              symbol: `${symbol}/USD`,
              name: symbol,
              price: parseFloat(quote["05. price"]),
            };
          } catch {
            return {
              symbol: `${symbol}/USD`,
              name: symbol,
              price: 0,
            };
          }
        })
      );

      const prices: Coin[] = [...cryptoCoins, ...stockCoins];

      /* ---------- SAVE CACHE ---------- */
      localStorage.setItem(
        CACHE_KEY,
        JSON.stringify({
          timestamp: Date.now(),
          coins: prices,
        })
      );

      setCoins(prices);

      /* ---------- OPTIONAL: UPSERT TO SUPABASE ---------- */
      for (const coin of prices) {
        await supabase.from("coins").upsert({
          symbol: coin.symbol,
          name: coin.name,
          price: coin.price,
        });
      }
    } catch (error) {
      console.error("Failed to fetch prices:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrices();

    const interval = setInterval(fetchPrices, 60_000); // refresh every 1 min
    return () => clearInterval(interval);
  }, []);

  return { coins, loading };
};

export default useCryptoPrices;

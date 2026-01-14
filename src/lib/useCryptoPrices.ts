import { useState, useEffect } from 'react';
import axios from 'axios';
import { supabase } from "@/lib/supabaseClient";

interface Coin {
  symbol: string;
  name: string;
  price: number;
}

const CACHE_TTL = 3 * 60 * 1000; // 3 minutes

const useCryptoPrices = (): Coin[] => {
  const [coins, setCoins] = useState<Coin[]>([]);

  const cryptoIds = [
    'bitcoin', 'ethereum', 'cardano', 'polkadot', 'avalanche-2', 'chainlink', 'litecoin', 'stellar', 'dogecoin', 'solana', 'matic-network', 'shiba-inu', 'tron', 'eos', 'monero', 'dash', 'zcash', 'bitcoin-cash', 'ethereum-classic', 'neo', 'nem', 'stellar-lumens', 'waves', 'qtum', 'komodo', 'steem', 'stratis', 'verge', 'pivx', 'reddcoin', 'binancecoin', 'uniswap', 'chainlink', 'aave', 'cosmos', 'tezos', 'theta', 'hedera-hashgraph', 'vechain', 'icon', 'waves', 'komodo', 'stratis',
  ];

  const alphaVantageApiKey = 'HBWKBIE9AIF6IQMO';

  const stockSymbols = [
    'AAPL', 'MSFT', 'NVDA', 'JPM', 'V', 'PYPL', 'TSLA'
  ];

  const fetchPrices = async () => {
    try {
      const cachedPrices = localStorage.getItem('prices');
      const cachedTimestamp = localStorage.getItem('timestamp');

      if (cachedPrices && cachedTimestamp) {
        const timestamp = parseInt(cachedTimestamp, 10);
        if (Date.now() - timestamp < CACHE_TTL) {
          setCoins(JSON.parse(cachedPrices));
          return;
        }
      }

      const { data: cryptoData } = await axios.get(
        `https://api.coingecko.com/api/v3/coins/markets`,
        {
          params: {
            vs_currency: 'usd',
            ids: cryptoIds.join(','),
          },
        }
      );

      const stockData = await Promise.all(stockSymbols.map(async (symbol) => {
        const { data } = await axios.get(
          `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${alphaVantageApiKey}`
        );

        if (data['Global Quote'] && data['Global Quote']['01. symbol'] && data['Global Quote']['05. price']) {
          return {
            symbol: symbol + '/USD',
            name: data['Global Quote']['01. symbol'],
            price: parseFloat(data['Global Quote']['05. price']),
          };
        } else {
          console.error(`Error fetching ${symbol} price:`, data);
          return {
            symbol: symbol + '/USD',
            name: symbol,
            price: 0,
          };
        }
      }));

      const prices = [
        ...cryptoData.map((coin: any) => ({
          symbol: coin.symbol + '/USD',
          name: coin.name,
          price: coin.current_price,
        })),
        ...stockData,
      ];

      localStorage.setItem('prices', JSON.stringify(prices));
      localStorage.setItem('timestamp', Date.now().toString());

      for (const coin of prices) {
        await supabase
          .from("coins")
          .upsert({ symbol: coin.symbol, name: coin.name, price: coin.price });
      }

      const { data: updatedCoins } = await supabase.from("coins").select("*");
      if (updatedCoins) {
        setCoins(updatedCoins as Coin[]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchPrices();
    const interval = setInterval(fetchPrices, 60000);
    return () => clearInterval(interval);
  }, []);

  return coins;
};

export default useCryptoPrices;
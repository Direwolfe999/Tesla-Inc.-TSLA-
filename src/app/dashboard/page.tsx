"use client";
import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import BuyCrypto from "@/components/Home/Hero/buy-form";
import SellCrypto from "@/components/Home/Hero/sell-form";
import Link from "next/link";
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination } from "swiper/modules";
import { CSVLink } from "react-csv";

import DepositForm from "@/components/Home/Hero/deposit-form";
import WithdrawForm from "@/components/Home/Hero/withdraw-form";

interface Transaction {
  id: string;
  type: "buy" | "sell" | "deposit" | "withdraw"; // added deposit & withdraw
  asset: string; // for deposit/withdraw, you can keep it as "USD" or null
  amount: number;
  price?: number; // optional because deposits/withdraws may not have a price
  created_at: string;
  status?: "pending" | "completed" | "failed"; // optional, if you track status
}


interface Holding {
  asset: string;
  quantity: number;
  value: number;
}

const Dashboard = () => {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [isBuying, setIsBuyingOpen] = useState(false);
  const [isSelling, setIsSellingOpen] = useState(false);
  const buyRef = useRef<HTMLDivElement>(null);
  const sellRef = useRef<HTMLDivElement>(null);
  const [profile, setProfile] = useState<any>(null);
  const [news, setNews] = useState<any[]>([]);
  const [visibleNews, setVisibleNews] = useState(6);
const [isDepositOpen, setIsDepositOpen] = useState(false);
const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);
  
const fetchNews = async () => {
  /* -------- Alpha Vantage -------- */
  const fetchAlphaVantage = async () => {
    const res = await fetch(
      `https://www.alphavantage.co/query?function=NEWS_SENTIMENT&tickers=TSLA&apikey=${process.env.NEXT_PUBLIC_ALPHAVANTAGE_API_KEY}`
    );

    const data = await res.json();

    if (!data.feed || !Array.isArray(data.feed)) {
      throw new Error("Alpha Vantage failed");
    }

    return data.feed.map((item: any) => ({
      title: item.title,
      url: item.url,
      summary: item.summary,
      banner_image: item.banner_image,
    }));
  };

  /* -------- NewsAPI Fallback -------- */
 const fetchMarketAux = async () => {
   const res = await fetch(
     `https://api.marketaux.com/v1/news/all?symbols=TSLA&filter_entities=true&language=en&api_token=${process.env.NEXT_PUBLIC_MARKETAUX_KEY}`,
   );

   const data = await res.json();

   if (!data.data || !Array.isArray(data.data)) {
     throw new Error("MarketAux failed");
   }

   return data.data.map((item: any) => ({
     title: item.title,
     url: item.url,
     summary: item.description,
     banner_image: item.image_url,
   }));
 };


  /* -------- Static Fallback -------- */
  const staticFallback = [
    {
      title: "Tesla launches new Cybertruck",
      url: "https://www.tesla.com/cybertruck",
      summary: "Tesla unveils new Cybertruck with updated features.",
      banner_image: "/images/tesla-cybertruck.jpg",
    },
  ];

  try {
    const alphaNews = await fetchAlphaVantage();
    setNews(alphaNews);
  } catch (alphaError) {
    console.warn("Alpha Vantage failed → trying NewsAPI");

    try {
      const marketAuxNews = await fetchMarketAux();
      setNews(marketAuxNews);
    } catch (marketAuxError) {
      console.error("Both news sources failed", marketAuxError);
      setNews(staticFallback);
    }
  }
};





  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) return router.push("/auth/signin");
      setUser(data.session.user);
      fetchAll(data.session.user.id);
      setupRealtime(data.session.user.id);
      fetchNews();
    });
  }, []);

  useEffect(() => {
    if (user) {
      supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single()
        .then(({ data }) => setProfile(data));

      const channel = supabase
        .channel("profiles")
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "profiles",
            filter: `id=eq.${user.id}`,
          },
          (payload) => {
            setProfile(payload.new);
          },
        )
        .subscribe();

      return () => {
        channel.unsubscribe();
      };
    }
  }, [user]);

  const fetchAll = async (userId: string) => {
    await Promise.all([fetchBalance(userId), fetchTransactions(userId)]);
  };

  const fetchBalance = async (userId: string) => {
    const { data, error } = await supabase
      .from("wallets")
      .select("balance")
      .eq("user_id", userId)
      .single();

    if (!error && data) {
      setBalance(data.balance);
    } else {
      console.error("Error fetching balance:", error);
    }
  };


  
  const fetchTransactions = async (userId: string) => {
    const { data, error } = await supabase
      .from("transactions")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setTransactions(data);
      computeHoldings(data);
    }
  };


  
  
  const setupRealtime = (userId: string) => {
    supabase
      .channel("wallet-updates")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "wallets",
          filter: `user_id=eq.${userId}`,
        },
        (payload: any) => {
          console.log("Received Update in Dashboard:", payload);
          if (payload.new?.balance !== undefined) {
            setBalance(Number(payload.new.balance));
            toast.success(`Wallet updated: $${payload.new.balance}`);
          }
        },
      )
      .subscribe();

    supabase
      .channel("tx-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "transactions",
          filter: `user_id=eq.${userId}`,
        },
        () => fetchTransactions(userId),
      )
      .subscribe();
  };

  const computeHoldings = (txs: Transaction[]) => {
    const map: Record<string, Holding> = {};

    txs.forEach((tx) => {
      if (!map[tx.asset]) {
        map[tx.asset] = { asset: tx.asset, quantity: 0, value: 0 };
      }
      const qty = tx.type === "buy" ? tx.amount : -tx.amount;
      map[tx.asset].quantity += qty;
      map[tx.asset].value += qty * (tx.price || 0);
    });

    setHoldings(Object.values(map).filter((h) => h.quantity > 0));
  };

  if (!user) return <p className="text-white">Loading...</p>;

  return (
    <div className="max-w-6xl mx-auto mt-40 text-white space-y-8 bg-gradient-to-b from-gray-900 to-violet-950 min-h-screen">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <div className="relative">
          <Link href="/profile">
            <img
              src={profile?.profile_pic_url || "/default-avatar.jpg"}
              alt="Profile Pic"
              className="w-10 h-10 rounded-full cursor-pointer"
              title="Profile"
            />
          </Link>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-dark_grey p-6 rounded-lg">
          <h2 className="text-2xl mb-3">Balance</h2>
          <p className="text-4xl font-bold text-primary">
            ${Number(balance ?? 0).toFixed(2)}
          </p>
        </div>
        <div className="bg-dark_grey p-6 rounded-lg">
          <h2 className="text-2xl mb-3">Actions</h2>
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => setIsBuyingOpen(true)}
              className="bg-primary text-white border border-primary px-6 py-3 rounded-lg hover:bg-transparent hover:text-primary transition-colors"
            >
              Buy Assets
            </button>
            <button
              onClick={() => setIsSellingOpen(true)}
              className="border border-primary px-6 py-3 rounded-lg text-primary hover:bg-primary hover:text-white transition-colors"
            >
              Sell Assets
            </button>
            <button
              onClick={() => setIsDepositOpen(true)}
              className="bg-green-600 px-6 py-3 rounded-lg text-white hover:bg-green-700 transition-colors"
            >
              Deposit
            </button>
            <button
              onClick={() => setIsWithdrawOpen(true)}
              className="bg-red-600 px-6 py-3 rounded-lg text-white hover:bg-red-700 transition-colors"
            >
              Withdraw
            </button>
          </div>
        </div>
      </div>
      {/* NEWS */}
      <div className="bg-dark_grey p-6 rounded-lg">
        <h2 className="text-2xl mb-3">Stock News</h2>
        {news.length === 0 ? (
          <p>No news available</p>
        ) : (
          <div className="block md:hidden">
            <Swiper
              modules={[Pagination]}
              pagination={{ clickable: true }}
              spaceBetween={20}
              slidesPerView={1}
            >
              {news.map((article, index) => (
                <SwiperSlide key={index}>
                  <div className="bg-gray-800 p-4 rounded-lg">
                    {article.banner_image && (
                      <img
                        src={article.banner_image}
                        alt={article.title}
                        className="w-full h-32 object-cover rounded-t-lg"
                      />
                    )}
                    <h3 className="text-lg font-bold mt-2">{article.title}</h3>
                    <p className="text-sm text-gray-400">{article.summary}</p>
                    <a
                      href={article.url}
                      className="text-primary hover:underline text-sm"
                    >
                      Read more
                    </a>
                  </div>
                </SwiperSlide>
              ))}
            </Swiper>
          </div>
        )}
        <div className="hidden md:block">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {news.slice(0, visibleNews).map((article, index) => (
              <div key={index} className="bg-gray-800 p-4 rounded-lg">
                {article.banner_image && (
                  <img
                    src={article.banner_image}
                    alt={article.title}
                    className="w-full h-32 object-cover rounded-t-lg"
                  />
                )}
                <h3 className="text-lg font-bold mt-2">{article.title}</h3>
                <p className="text-sm text-gray-400">{article.summary}</p>
                <a
                  href={article.url}
                  className="text-primary hover:underline text-sm"
                >
                  Read more
                </a>
              </div>
            ))}
          </div>
          {visibleNews < news.length && (
            <button
              onClick={() => setVisibleNews(visibleNews + 6)}
              className="mt-4 bg-primary text-white px-4 py-2 rounded-lg"
            >
              Load more
            </button>
          )}
        </div>
      </div>
      {/* <!-- TRANSACTIONS --> */}
      <div className="bg-dark_grey p-6 rounded-lg">
        <h2 className="text-2xl mb-3">Transaction History</h2>
        <ul className="space-y-2 max-h-64 overflow-y-auto">
          {transactions.map((tx) => {
            // Set color based on type
            let bgColor = "";
            if (tx.type === "buy" || tx.type === "deposit")
              bgColor = "bg-green-600";
            if (tx.type === "sell" || tx.type === "withdraw")
              bgColor = "bg-red-600";

            return (
              <li key={tx.id} className={`p-2 rounded ${bgColor}`}>
                {tx.type?.toUpperCase()} {tx.amount} {tx.asset}
                {/* Show price only for buy/sell */}
                {(tx.type === "buy" || tx.type === "sell") && ` @ $${tx.price}`}
                {/* Show status if available */}
                {tx.status ? ` (${tx.status})` : ""}
              </li>
            );
          })}
        </ul>
        <div className="mt-4">
          <CSVLink
            data={transactions}
            filename="transactions.csv"
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            Export CSV
          </CSVLink>
        </div>
      </div>

      {/* <!-- MODALS --> */}
      {isBuying && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center">
          <div ref={buyRef} className="bg-dark_grey p-6 rounded-lg">
            <BuyCrypto balance={balance}/>
            <button onClick={() => setIsBuyingOpen(false)}>Close</button>
          </div>
        </div>
      )}
      {isSelling && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center">
          <div ref={sellRef} className="bg-dark_grey p-6 rounded-lg">
            <SellCrypto balance={balance} />
            <button onClick={() => setIsSellingOpen(false)}>Close</button>
          </div>
        </div>
      )}
      {/* Deposit & Withdraw Modals */}
      {isDepositOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center">
          <div className="bg-dark_grey p-6 rounded-lg">
            <DepositForm
              onClose={() => setIsDepositOpen(false)}
              onSuccess={(newBalance) =>
                setBalance((prevBalance) => prevBalance + Number(newBalance))
              }
            />
          </div>
        </div>
      )}
      {isWithdrawOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center">
          <div className="bg-dark_grey p-6 rounded-lg">
            <WithdrawForm
              onClose={() => setIsWithdrawOpen(false)}
              currentBalance={balance}
              onSuccess={(newBalance) => setBalance(newBalance)}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;

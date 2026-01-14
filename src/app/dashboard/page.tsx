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



interface Transaction {
  id: string;
  type: "buy" | "sell";
  asset: string;
  amount: number;
  price: number;
  created_at: string;
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

  interface Cache {
    news?: {
      timestamp: number;
      data: any;
    };
  }
  const cache: Cache = {};

  const fetchNews = async () => {
    try {
      const cachedResponse = cache.news;
      if (cachedResponse && cachedResponse.timestamp > Date.now() - 60 * 1000) {
        setNews(cachedResponse.data);
        return;
      }
      const response = await fetch(
        `https://www.alphavantage.co/query?function=NEWS_SENTIMENT&tickers=AAPL&apikey=HBWKBIE9AIF6IQMO`
      );
      const data = await response.json();
      if (data.feed) {
        cache.news = {
          timestamp: Date.now(),
          data: data.feed,
        };
        setNews(data.feed);
      } else {
        console.error("Invalid API response:", data);
      }
    } catch (error) {
      console.error(error);
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
          }
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
      .channel("wallet-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "wallets",
          filter: `user_id=eq.${userId}`,
        },
        (payload: any) => {
          if (payload.new?.balance !== undefined) {
            setBalance(Number(payload.new.balance));
          }
        }
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
        (payload) => fetchTransactions(userId)
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
      map[tx.asset].value += qty * tx.price;
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
            {" "}
            ${balance.toFixed(2)}{" "}
          </p>
        </div>
        <div className="bg-dark_grey p-6 rounded-lg">
          <h2 className="text-2xl mb-3">Actions</h2>
          <div className="flex gap-6">
            <button
              onClick={() => setIsBuyingOpen(true)}
              className="bg-primary px-6 py-2 rounded-lg"
            >
              Buy Assets
            </button>
            <button
              onClick={() => setIsSellingOpen(true)}
              className="border border-primary px-6 py-2 rounded-lg text-primary"
            >
              Sell Assets
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
          {transactions.map((tx) => (
            <li
              key={tx.id}
              className={`p-2 rounded ${
                tx.type === "buy" ? "bg-green-600" : "bg-red-600"
              }`}
            >
              {tx.type?.toUpperCase()} {tx.amount} {tx.asset} @ ${tx.price}
            </li>
          ))}
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
            <BuyCrypto />
            <button onClick={() => setIsBuyingOpen(false)}>Close</button>
          </div>
        </div>
      )}
      {isSelling && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center">
          <div ref={sellRef} className="bg-dark_grey p-6 rounded-lg">
            <SellCrypto />
            <button onClick={() => setIsSellingOpen(false)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;

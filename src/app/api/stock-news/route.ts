import { NextResponse } from "next/server";

let cachedNews: any[] | null = null;
let lastFetchTime = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

const NEWSAPI_KEY = process.env.NEWSAPI_KEY;
const ALPHAVANTAGE_KEY = process.env.ALPHAVANTAGE_API_KEY;

const fallbackNews = [
  {
    title: "Tesla launches new Cybertruck",
    url: "https://www.tesla.com/cybertruck",
    summary: "Tesla unveils new Cybertruck with updated features.",
    banner_image: "/images/tesla-cybertruck.webp",
  },
  {
    title: "TSLA stock rises amid EV boom",
    url: "https://finance.example.com/tesla-stock",
    summary: "Tesla shares gain on strong EV sales data.",
    banner_image: "/images/tesla-stock.png",
  },
];

async function fetchAlphaVantageNews() {
  if (!ALPHAVANTAGE_KEY) throw new Error("Missing Alpha Vantage API key");

  const res = await fetch(
    `https://www.alphavantage.co/query?function=NEWS_SENTIMENT&tickers=TSLA&apikey=${ALPHAVANTAGE_KEY}`,
    { cache: "no-store" }
  );

  const data = await res.json();

  if (!data.feed) {
    throw new Error("Invalid Alpha Vantage response");
  }

  return data.feed;
}

async function fetchNewsAPI() {
  if (!NEWSAPI_KEY) throw new Error("Missing NewsAPI key");

  const res = await fetch(
    `https://newsapi.org/v2/everything?q=Tesla&sortBy=publishedAt&pageSize=10&apiKey=${NEWSAPI_KEY}`
  );
  const data = await res.json();

  if (!data.articles) throw new Error("Invalid NewsAPI response");

  // Map NewsAPI articles to same format as Alpha Vantage
  return data.articles.map((a: any) => ({
    title: a.title,
    url: a.url,
    summary: a.description,
    banner_image: a.urlToImage,
  }));
}

export async function GET() {
  try {
    // Return cached news if valid
    if (cachedNews && Date.now() - lastFetchTime < CACHE_DURATION) {
      return NextResponse.json(cachedNews);
    }

    let news: any[] = [];

    try {
      news = await fetchAlphaVantageNews();
    } catch (error: unknown) {
      console.error("Alpha Vantage failed:", error);
      try {
        news = await fetchNewsAPI();
      } catch (error: unknown) {
        console.error("NewsAPI fallback failed:", error);
        news = fallbackNews;
      }
    }

    cachedNews = news;
    lastFetchTime = Date.now();

    return NextResponse.json(cachedNews);
  } catch (error: unknown) {
    console.error("Final stock news error:", error);
    return NextResponse.json({ error: "Failed to fetch stock news" }, { status: 500 });
  }
}

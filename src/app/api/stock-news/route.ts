import { NextResponse } from "next/server";

let cachedNews: any[] | null = null;
let lastFetchTime = 0;

// cache for 5 minutes
const CACHE_DURATION = 5 * 60 * 1000;

export async function GET() {
  try {
    // ✅ Return cached data if still valid
    if (cachedNews && Date.now() - lastFetchTime < CACHE_DURATION) {
      return NextResponse.json(cachedNews);
    }

    const apiKey = process.env.ALPHAVANTAGE_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "Missing Alpha Vantage API key" },
        { status: 500 }
      );
    }

    const response = await fetch(
      `https://www.alphavantage.co/query?function=NEWS_SENTIMENT&tickers=AAPL&apikey=${apiKey}`,
      { cache: "no-store" }
    );

    const data = await response.json();

    if (!data.feed) {
      return NextResponse.json(
        { error: "Invalid API response", raw: data },
        { status: 500 }
      );
    }

    // ✅ Save to cache
    cachedNews = data.feed;
    lastFetchTime = Date.now();

    return NextResponse.json(cachedNews);
  } catch (error) {
    console.error("Stock news error:", error);
    return NextResponse.json(
      { error: "Failed to fetch stock news" },
      { status: 500 }
    );
  }
}

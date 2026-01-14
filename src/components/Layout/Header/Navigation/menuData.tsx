import { HeaderItem } from "@/types/menu";
const observerUrl = process.env.NEXT_PUBLIC_OBSERVER_URL;

export const headerData: HeaderItem[] = [
  { label: "Buy & Sell", href: "/#main-banner" },
  { label: "Development", href: "/#development" },
  { label: "Apex", href: "/#work" },
  { label: "Portfolio", href: "/#portfolio" },
  { label: "Upgrade", href: "/#upgrade" },
  {
    label: "Stock Market",
    href: observerUrl ? observerUrl : "http://localhost:3001",
  },
];

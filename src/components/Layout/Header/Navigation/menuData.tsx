import { HeaderItem } from "@/types/menu";
const observerUrl = process.env.NEXT_PUBLIC_OBSERVER_URL;

export const headerData: HeaderItem[] = [
  { label: "Trade", href: "/#main-banner" },
  { label: "Build", href: "/#development" },
  { label: "Prime", href: "/#work" },
  { label: "Work", href: "/#portfolio" },
  { label: "Pro", href: "/#upgrade" },
  { label: "Market", href: observerUrl || "http://tesla-stockbox.vercel.app" },
];

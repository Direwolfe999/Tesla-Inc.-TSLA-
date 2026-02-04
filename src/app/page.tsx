import React from "react";
import Hero from "@/components/Home/Hero";
// 1. Import the new Ecosystem component
import Ecosystem from "@/components/Home/ecosystem"; 
import Work from "@/components/Home/work";
import TimeLine from "@/components/Home/timeline";
import Platform from "@/components/Home/platform";
import Portfolio from "@/components/Home/portfolio";
import Upgrade from "@/components/Home/upgrade";
import TeslaShowcase from "@/components/Home/showcase";
import Perks from "@/components/Home/perks";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Tesla, Inc (TSLA)",
};

export default function Home() {
  return (
    <main>
      <Hero />
      {/* 2. Place it here so it flows from Hero into Ecosystem */}
      <Ecosystem /> 
      <Work />
      <TimeLine />
      <Platform />
      <Portfolio />
      <Upgrade />
      <TeslaShowcase/>
      <Perks />
    </main>
  );
}
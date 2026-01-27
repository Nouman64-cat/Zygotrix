import type { Metadata } from "next";
import React from "react";
import HeroSection from "../components/home/HeroSection";
import YouTubeVideo from "../components/home/YouTubeVideo";
import PricingClient from "../components/pricing/PricingClient";
import ZygoAISectionClient from "../components/home/ZygoAISectionClient";
import CommunitySectionClient from "../components/home/CommunitySectionClient";

export const metadata: Metadata = {
  title: "Zygotrix - Genetic Analysis & Simulation Platform",
  description: "Zygotrix is a comprehensive platform for genetic analysis, DNA sequencing simulation, and inheritance pattern modeling. Built for researchers and teams.",
  openGraph: {
    title: "Zygotrix - Genetic Analysis Platform",
    description: "Advanced tools for genetic analysis and simulation.",
    images: ["https://ap-south-1.graphassets.com/cmg0d4awz0abu07pfgv3s80hg/cmg0o8wb80r7d07pd9fu2aywz"],
  },
};

export default function Home() {
  return (
    <main>
      <HeroSection />
      <YouTubeVideo />
      <ZygoAISectionClient />
      <PricingClient />
      <CommunitySectionClient />
    </main>
  );
}

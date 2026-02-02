import type { Metadata } from "next";
import React from "react";
import { SEO_KEYWORDS } from "../config/seo";
import HeroSection from "../components/home/HeroSection";
import YouTubeVideo from "../components/home/YouTubeVideo";
import PricingClient from "../components/pricing/PricingClient";
import ZygoAISectionClient from "../components/home/ZygoAISectionClient";
import CommunitySectionClient from "../components/home/CommunitySectionClient";
import AppSelectionSection from "../components/home/AppSelectionSection";

export const metadata: Metadata = {
  title: "Zygotrix - Genetic Analysis & Simulation Platform",
  description: "Zygotrix is a comprehensive platform for genetic analysis, DNA sequencing simulation, and inheritance pattern modeling. Built for researchers and teams.",
  keywords: SEO_KEYWORDS.HOME,
  openGraph: {
    title: "Zygotrix - Genetic Analysis Platform",
    description: "Advanced tools for genetic analysis and simulation.",
    images: ["https://ap-south-1.graphassets.com/cmg0d4awz0abu07pfgv3s80hg/cmg0o8wb80r7d07pd9fu2aywz"],
  },
};

export default function Home() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'Zygotrix',
    applicationCategory: 'ScientificApplication',
    operatingSystem: 'Web browser',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    description: 'Comprehensive platform for genetic analysis and simulation.',
    publisher: {
      '@type': 'Organization',
      name: 'Zygotrix',
      logo: 'https://cdn-zygotrix.s3.us-east-1.amazonaws.com/zygotrix-logo.png',
      url: 'https://zygotrix.com'
    }
  }
  return (
    <main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <HeroSection />
      <AppSelectionSection />
      <YouTubeVideo />
      <ZygoAISectionClient />
      <PricingClient />
      <CommunitySectionClient />
    </main>
  );
}

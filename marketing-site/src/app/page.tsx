import type { Metadata } from "next";
import HeroSection from "../components/home/HeroSection";

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
    <>
      <HeroSection />
      {/* <FeatureHighlights cards={featureCards} /> */}
      {/* <WorkflowSection steps={workflow} /> */}
      {/* <ZygoAISection /> */}
      {/* <PricingSection /> */}
      {/* <CommunitySection /> */}
      {/* <CTASection /> */}
    </>
  );
}

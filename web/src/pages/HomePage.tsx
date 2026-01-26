import React from "react";

import CommunitySection from "../components/marketing_site/home/CommunitySection";
import HeroSection from "../components/marketing_site/home/HeroSection";
import PricingSection from "../components/marketing_site/home/PricingSection";
import ZygoAISection from "../components/marketing_site/home/ZygoAISection";
import useDocumentTitle from "../hooks/useDocumentTitle";

import { Helmet } from "react-helmet-async";

const HomePage: React.FC = () => {
  useDocumentTitle("Home");

  return (
    <>
      <Helmet>
        <title>Zygotrix - Genetic Analysis & Simulation Platform</title>
        <meta name="description" content="Zygotrix is a comprehensive platform for genetic analysis, DNA sequencing simulation, and inheritance pattern modeling. Built for researchers and teams." />
        {/* Open Graph tags for Social Media Previews */}
        <meta property="og:title" content="Zygotrix - Genetic Analysis Platform" />
        <meta property="og:description" content="Advanced tools for genetic analysis and simulation." />
        <meta property="og:image" content="https://ap-south-1.graphassets.com/cmg0d4awz0abu07pfgv3s80hg/cmg0o8wb80r7d07pd9fu2aywz" />
      </Helmet>
      <HeroSection />
      {/* <FeatureHighlights cards={featureCards} /> */}
      {/* <WorkflowSection steps={workflow} /> */}
      <ZygoAISection />
      <PricingSection />
      <CommunitySection />
      {/* <CTASection /> */}
    </>
  );
};

export default HomePage;


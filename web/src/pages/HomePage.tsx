import React from "react";

import CTASection from "../components/marketing_site/home/CTASection";
import FeatureHighlights from "../components/marketing_site/home/FeatureHighlights";
import HeroSection from "../components/marketing_site/home/HeroSection";
import WorkflowSection from "../components/marketing_site/home/WorkflowSection";
import ZygoAISection from "../components/marketing_site/home/ZygoAISection";
import { featureCards, workflow } from "../data/content";

const HomePage: React.FC = () => {
  return (
    <>
      <HeroSection />
      <FeatureHighlights cards={featureCards} />
      <WorkflowSection steps={workflow} />
      <ZygoAISection />
      <CTASection />
    </>
  );
};

export default HomePage;

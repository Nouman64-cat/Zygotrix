import React from "react";

import CTASection from "../components/CTASection";
import FeatureHighlights from "../components/FeatureHighlights";
import HeroSection from "../components/HeroSection";
import WorkflowSection from "../components/WorkflowSection";
import { featureCards, workflow } from "../data/content";

const HomePage: React.FC = () => {
  return (
    <>
      <HeroSection />
      <FeatureHighlights cards={featureCards} />
      <WorkflowSection steps={workflow} />
      <CTASection />
    </>
  );
};

export default HomePage;

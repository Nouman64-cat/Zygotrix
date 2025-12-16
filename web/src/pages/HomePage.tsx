import React from "react";

import CTASection from "../components/marketing_site/home/CTASection";
import DnaGeneratorSection from "../components/marketing_site/home/DnaGeneratorSection";
import FeatureHighlights from "../components/marketing_site/home/FeatureHighlights";
import HeroSection from "../components/marketing_site/home/HeroSection";
import WorkflowSection from "../components/marketing_site/home/WorkflowSection";
import ZygoAISection from "../components/marketing_site/home/ZygoAISection";
import { featureCards, workflow } from "../data/content";
import useDocumentTitle from "../hooks/useDocumentTitle";

const HomePage: React.FC = () => {
  useDocumentTitle("Home");

  return (
    <>
      <HeroSection />
      <FeatureHighlights cards={featureCards} />
      <WorkflowSection steps={workflow} />
      <DnaGeneratorSection />
      <ZygoAISection />
      <CTASection />
    </>
  );
};

export default HomePage;

import React from "react";

import CommunitySection from "../components/marketing_site/home/CommunitySection";
import DnaGeneratorSection from "../components/marketing_site/home/DnaGeneratorSection";
import HeroSection from "../components/marketing_site/home/HeroSection";
import ZygoAISection from "../components/marketing_site/home/ZygoAISection";
import useDocumentTitle from "../hooks/useDocumentTitle";

const HomePage: React.FC = () => {
  useDocumentTitle("Home");

  return (
    <>
      <HeroSection />
      {/* <FeatureHighlights cards={featureCards} /> */}
      {/* <WorkflowSection steps={workflow} /> */}
      <DnaGeneratorSection />
      <ZygoAISection />
      <CommunitySection />
      {/* <CTASection /> */}
    </>
  );
};

export default HomePage;


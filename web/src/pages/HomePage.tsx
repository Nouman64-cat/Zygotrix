import React from "react";

import CTASection from "../components/CTASection";
import FeatureHighlights from "../components/FeatureHighlights";
import HeroSection from "../components/HeroSection";
import WorkflowSection from "../components/WorkflowSection";
import { featureCards, stats, workflow } from "../data/content";
import { usePolygenicScore } from "../hooks/usePolygenicScore";

const HomePage: React.FC = () => {
  const { score, loading, error } = usePolygenicScore();

  return (
    <>
      <HeroSection stats={stats} polygenic={{ score, loading, error }} />
      <FeatureHighlights cards={featureCards} />
      <WorkflowSection steps={workflow} />
      <CTASection />
    </>
  );
};

export default HomePage;

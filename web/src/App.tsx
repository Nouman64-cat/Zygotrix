import React from "react";

import CTASection from "./components/CTASection";
import FeatureHighlights from "./components/FeatureHighlights";
import Footer from "./components/Footer";
import HeroSection from "./components/HeroSection";
import LiveSandbox from "./components/LiveSandbox";
import WorkflowSection from "./components/WorkflowSection";
import { featureCards, stats, workflow } from "./data/content";
import { usePolygenicScore } from "./hooks/usePolygenicScore";
import { useTraits } from "./hooks/useTraits";

const App: React.FC = () => {
  const { traits, loading: traitsLoading, error: traitsError, reload } = useTraits();
  const { score, loading: polygenicLoading, error: polygenicError } = usePolygenicScore();

  return (
    <div className="min-h-screen bg-slate-50">
      <HeroSection
        stats={stats}
        polygenic={{ score, loading: polygenicLoading, error: polygenicError }}
      />
      <FeatureHighlights cards={featureCards} />
      <LiveSandbox traits={traits} loading={traitsLoading} error={traitsError} reload={reload} />
      <WorkflowSection steps={workflow} />
      <CTASection />
      <Footer />
    </div>
  );
};

export default App;
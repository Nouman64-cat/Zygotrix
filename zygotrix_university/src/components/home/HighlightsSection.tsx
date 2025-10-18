import SectionHeading from "../common/SectionHeading";
import Container from "../common/Container";
import HighlightsGrid from "../shared/HighlightsGrid";

interface Highlight {
  id: string;
  metric: string;
  label: string;
  description: string;
}

interface HighlightsSectionProps {
  highlights: Highlight[];
}

const HighlightsSection = ({ highlights }: HighlightsSectionProps) => {
  return (
    <section className="pt-20">
      <Container className="px-0 sm:px-0">
        <SectionHeading
          eyebrow="Proof Points"
          title="Momentum backed by learner data."
          description="Track how your growth compounds across cohorts, practice sessions, and launch-ready projects."
        />
        <div className="mt-8">
          <HighlightsGrid items={highlights} />
        </div>
      </Container>
    </section>
  );
};

export default HighlightsSection;

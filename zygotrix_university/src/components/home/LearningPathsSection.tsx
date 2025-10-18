import SectionHeading from "../common/SectionHeading";
import Container from "../common/Container";
import LearningPathCard from "../cards/LearningPathCard";
import type { LearningPath } from "../../types";

interface LearningPathsSectionProps {
  paths: LearningPath[];
}

const LearningPathsSection = ({ paths }: LearningPathsSectionProps) => {
  return (
    <section className="pt-20">
      <Container className="px-0 sm:px-0">
        <SectionHeading
          eyebrow="Career Journeys"
          title="Curated paths that keep you shipping."
          description="Each learning path stacks programs, coaching, and practice sets so you can pivot quickly into the roles you want."
        />
        <div className="mt-8 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {paths.map((path) => (
            <LearningPathCard key={path.id} path={path} />
          ))}
        </div>
      </Container>
    </section>
  );
};

export default LearningPathsSection;

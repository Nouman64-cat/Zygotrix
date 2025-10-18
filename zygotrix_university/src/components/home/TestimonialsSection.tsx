import SectionHeading from "../common/SectionHeading";
import Container from "../common/Container";
import TestimonialCard from "../cards/TestimonialCard";
import type { Testimonial } from "../../types";

interface TestimonialsSectionProps {
  testimonials: Testimonial[];
}

const TestimonialsSection = ({ testimonials }: TestimonialsSectionProps) => {
  return (
    <section className="pt-20">
      <Container className="px-0 sm:px-0">
        <SectionHeading
          eyebrow="Learner Outcomes"
          title="Stories from builders who turned knowledge into momentum."
          description="From product managers to platform engineers, learners around the world rely on Zygotrix University to rehearse launch-critical skills."
        />
        <div className="mt-8 grid gap-6 md:grid-cols-3">
          {testimonials.map((item) => (
            <TestimonialCard key={item.id} testimonial={item} />
          ))}
        </div>
      </Container>
    </section>
  );
};

export default TestimonialsSection;

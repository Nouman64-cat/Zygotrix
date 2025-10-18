import SectionHeading from "../common/SectionHeading";
import Container from "../common/Container";
import FaqAccordion from "../shared/FaqAccordion";
import type { FaqItem } from "../../types";

interface FaqSectionProps {
  items: FaqItem[];
}

const FaqSection = ({ items }: FaqSectionProps) => {
  return (
    <section className="scroll-mt-24 pt-20" id="faqs">
      <Container className="px-0 sm:px-0">
        <div className="rounded-[2.5rem] border border-white/10 bg-white/5 p-8 sm:p-12">
          <SectionHeading
            eyebrow="Support"
            title="Everything you need to know about studying at Zygotrix University."
            description="Still have questions? Our learner success team is online 7 days a week."
            align="center"
          />
          <div className="mt-10">
            <FaqAccordion items={items} />
          </div>
        </div>
      </Container>
    </section>
  );
};

export default FaqSection;

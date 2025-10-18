import HeroSection from "../components/home/HeroSection";
import TrustedPartners from "../components/home/TrustedPartners";
import FeaturedCoursesSection from "../components/home/FeaturedCoursesSection";
import LearningPathsSection from "../components/home/LearningPathsSection";
import HighlightsSection from "../components/home/HighlightsSection";
import PracticePreviewSection from "../components/home/PracticePreviewSection";
import TestimonialsSection from "../components/home/TestimonialsSection";
import FaqSection from "../components/home/FaqSection";
import CallToActionSection from "../components/home/CallToActionSection";
import {
  learningPaths,
  testimonials,
  faqs,
  partnerLogos,
  highlights,
} from "../data/universityData";
import { useCourses } from "../hooks/useCourses";
import { usePracticeSets } from "../hooks/usePracticeSets";

const HomePage = () => {
  const { courses, loading: coursesLoading } = useCourses();
  const { practiceSets, loading: practiceLoading } = usePracticeSets();

  const featured = courses.slice(0, 4);
  const practiceTopics = practiceSets.slice(0, 4);

  return (
    <div className="space-y-16 sm:space-y-20">
      <HeroSection />
      <TrustedPartners partners={partnerLogos} />
      <FeaturedCoursesSection courses={featured} loading={coursesLoading} />
      <LearningPathsSection paths={learningPaths} />
      <HighlightsSection highlights={highlights} />
      <PracticePreviewSection topics={practiceTopics} loading={practiceLoading} />
      <TestimonialsSection testimonials={testimonials} />
      <FaqSection items={faqs} />
      <CallToActionSection />
    </div>
  );
};

export default HomePage;

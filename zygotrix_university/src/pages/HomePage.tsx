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
  featuredCourses,
  learningPaths,
  practiceTopics,
  testimonials,
  faqs,
  partnerLogos,
  highlights,
} from "../data/universityData";

const HomePage = () => {
  return (
    <div className="space-y-16 sm:space-y-20">
      <HeroSection />
      <TrustedPartners partners={partnerLogos} />
      <FeaturedCoursesSection courses={featuredCourses} />
      <LearningPathsSection paths={learningPaths} />
      <HighlightsSection highlights={highlights} />
      <PracticePreviewSection topics={practiceTopics} />
      <TestimonialsSection testimonials={testimonials} />
      <FaqSection items={faqs} />
      <CallToActionSection />
    </div>
  );
};

export default HomePage;

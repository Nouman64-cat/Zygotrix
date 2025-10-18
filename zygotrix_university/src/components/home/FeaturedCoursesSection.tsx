import SectionHeading from "../common/SectionHeading";
import Container from "../common/Container";
import CourseCard from "../cards/CourseCard";
import type { Course } from "../../types";

interface FeaturedCoursesSectionProps {
  courses: Course[];
  loading?: boolean;
}

const FeaturedCoursesSection = ({ courses, loading = false }: FeaturedCoursesSectionProps) => {
  return (
    <section className="pt-16">
      <Container className="px-0 sm:px-0">
        <SectionHeading
          eyebrow="Flagship Programs"
          title="Targeted curriculum designed with industry mentors."
          description="Dive into immersive experiences built around real team ceremonies, code reviews, and design critiques. Every program integrates Simulation Studio labs so you graduate with proof of execution."
        />
        {loading && courses.length === 0 ? (
          <div className="mt-8 grid gap-8 md:grid-cols-2">
            {Array.from({ length: 2 }).map((_, index) => (
              <div
                key={index}
                className="h-72 animate-pulse rounded-3xl border border-white/10 bg-white/5"
              />
            ))}
          </div>
        ) : (
          <div className="mt-8 grid gap-8 md:grid-cols-2">
            {courses.map((course) => (
              <CourseCard key={course.slug ?? course.id} course={course} />
            ))}
          </div>
        )}
      </Container>
    </section>
  );
};

export default FeaturedCoursesSection;

import SectionHeading from "../common/SectionHeading";
import Container from "../common/Container";
import CourseCard from "../cards/CourseCard";
import type { Course } from "../../types";

interface FeaturedCoursesSectionProps {
  courses: Course[];
}

const FeaturedCoursesSection = ({ courses }: FeaturedCoursesSectionProps) => {
  return (
    <section className="pt-16">
      <Container className="px-0 sm:px-0">
        <SectionHeading
          eyebrow="Flagship Programs"
          title="Targeted curriculum designed with industry mentors."
          description="Dive into immersive experiences built around real team ceremonies, code reviews, and design critiques. Every program integrates Simulation Studio labs so you graduate with proof of execution."
        />
        <div className="mt-8 grid gap-8 md:grid-cols-2">
          {courses.map((course) => (
            <CourseCard key={course.id} course={course} />
          ))}
        </div>
      </Container>
    </section>
  );
};

export default FeaturedCoursesSection;

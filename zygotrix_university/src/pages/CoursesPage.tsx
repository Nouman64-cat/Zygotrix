import { FiFilter, FiStar, FiGrid } from "react-icons/fi";
import PageHeader from "../components/common/PageHeader";
import AccentButton from "../components/common/AccentButton";
import CourseCard from "../components/cards/CourseCard";
import Container from "../components/common/Container";
import { useCourses } from "../hooks/useCourses";

const categories = ["Artificial Intelligence", "Product Design", "Cloud Engineering", "Data Science", "Leadership"];
const levels: Array<"Beginner" | "Intermediate" | "Advanced"> = ["Beginner", "Intermediate", "Advanced"];

const CoursesPage = () => {
  const { courses, loading } = useCourses();
  const highlightCourse = courses[0];

  return (
    <div className="space-y-16">
      <PageHeader
        eyebrow="Program Catalog"
        title="Curated programs engineered to help you ship faster."
        description={
          <p>
            Explore studio-crafted experiences spanning AI, design, engineering, and leadership. Each course blends
            guided instruction, mentor feedback, and Simulation Studio labs to reinforce outcomes.
          </p>
        }
        actions={
          <>
            <AccentButton to="/paths">View Learning Paths</AccentButton>
            <AccentButton to="/practice" variant="secondary">
              Practice MCQs
            </AccentButton>
          </>
        }
      />

      <Container className="space-y-10">
        <div className="flex flex-col gap-5 rounded-[2.5rem] border border-white/10 bg-white/5 p-6 sm:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3 text-sm font-semibold text-indigo-200">
              <FiFilter />
              Filter Programs
            </div>
            <AccentButton variant="ghost" icon={<FiGrid />}>
              Grid View
            </AccentButton>
          </div>
          <div className="flex flex-wrap gap-3">
            {categories.map((category) => (
              <button
                key={category}
                className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-slate-200 transition hover:border-indigo-400 hover:text-white"
              >
                {category}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-3">
            {levels.map((level) => (
              <button
                key={level}
                className="rounded-full border border-white/10 bg-transparent px-4 py-2 text-xs font-semibold text-slate-200 transition hover:border-indigo-400 hover:bg-indigo-500/10 hover:text-white"
              >
                {level}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-10">
          <div className="overflow-hidden rounded-[2.5rem] border border-white/10 bg-gradient-to-r from-indigo-500/20 via-indigo-500/10 to-transparent p-8 sm:p-12">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="max-w-2xl space-y-4">
                <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-indigo-200">
                  Editor’s Choice
                  <FiStar />
                </span>
                <h2 className="text-3xl font-semibold text-white">
                  {highlightCourse?.title ?? "Spotlight course"}
                </h2>
                <p className="text-sm text-indigo-100">
                  {highlightCourse?.shortDescription ??
                    "Pair structured lessons with Simulation Studio labs to rehearse product decisions."}
                </p>
              </div>
              {highlightCourse && (
                <AccentButton to={`/courses/${highlightCourse.slug ?? highlightCourse.id}`}>
                  View Syllabus
                </AccentButton>
              )}
            </div>
          </div>

          {loading ? (
            <div className="grid gap-8 md:grid-cols-2">
              {Array.from({ length: 4 }).map((_, index) => (
                <div
                  key={index}
                  className="h-72 animate-pulse rounded-3xl border border-white/10 bg-white/5"
                />
              ))}
            </div>
          ) : (
            <div className="grid gap-8 md:grid-cols-2">
              {courses.map((course) => (
                <CourseCard key={course.slug ?? course.id} course={course} />
              ))}
            </div>
          )}
        </div>
      </Container>
    </div>
  );
};

export default CoursesPage;

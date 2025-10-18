import { useParams, Navigate } from "react-router-dom";
import { FiClock, FiPlayCircle, FiUsers, FiExternalLink } from "react-icons/fi";
import AccentButton from "../components/common/AccentButton";
import Container from "../components/common/Container";
import PageHeader from "../components/common/PageHeader";
import { useCourseDetail } from "../hooks/useCourseDetail";

const CourseDetailPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const { course, loading } = useCourseDetail(slug);

  if (!loading && !course) {
    return <Navigate to="/courses" replace />;
  }

  if (!course) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-indigo-200">
        Loading course...
      </div>
    );
  }

  return (
    <div className="space-y-16">
      <PageHeader
        eyebrow={course.category}
        title={course.title}
        description={
          <div className="space-y-3 text-sm text-indigo-100">
            {course.shortDescription && <p>{course.shortDescription}</p>}
            <div className="flex flex-wrap gap-3 text-xs text-slate-200">
              {course.duration && (
                <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1">
                  <FiClock />
                  {course.duration}
                </span>
              )}
              {course.lessons != null && (
                <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1">
                  <FiPlayCircle />
                  {course.lessons} lessons
                </span>
              )}
              {course.students != null && (
                <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1">
                  <FiUsers />
                  {course.students.toLocaleString()} learners
                </span>
              )}
            </div>
          </div>
        }
        actions={
          <>
            <AccentButton icon={<FiExternalLink />}>Enroll now</AccentButton>
            <AccentButton variant="secondary" to="/practice">
              Practice companion
            </AccentButton>
          </>
        }
      />

      <Container className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-6">
          <div className="rounded-[2.5rem] border border-white/10 bg-white/5 p-8">
            <h2 className="text-2xl font-semibold text-white">What you’ll master</h2>
            <ul className="mt-4 space-y-3 text-sm text-slate-200">
              {course.outcomes.map((outcome) => (
                <li key={outcome.id ?? outcome.text}>• {outcome.text}</li>
              ))}
            </ul>
          </div>

          <div className="space-y-4">
            {course.modules.map((module) => (
              <div
                key={module.id}
                className="rounded-3xl border border-white/10 bg-white/5 p-6 text-sm text-slate-200"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.28em] text-indigo-200">
                      Module
                    </p>
                    <h3 className="text-lg font-semibold text-white">{module.title}</h3>
                  </div>
                  {module.duration && (
                    <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-indigo-100">
                      {module.duration}
                    </span>
                  )}
                </div>
                {module.description && (
                  <p className="mt-2 text-sm text-slate-300">{module.description}</p>
                )}
                <ul className="mt-3 space-y-2 text-xs text-slate-200">
                  {module.items.map((item) => (
                    <li key={item.id ?? item.title}>• {item.title}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <aside className="space-y-6">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <h3 className="text-lg font-semibold text-white">Meet your instructors</h3>
            <div className="mt-4 space-y-4">
              {(course.instructors ?? []).map((instructor) => (
                <div
                  key={instructor.id ?? instructor.name}
                  className="flex gap-4 rounded-2xl border border-white/10 bg-white/5 p-4"
                >
                  <img
                    src={
                      instructor.avatar ??
                      "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=200&q=60"
                    }
                    alt={instructor.name}
                    className="h-12 w-12 rounded-full border border-white/10 object-cover"
                    loading="lazy"
                  />
                  <div className="text-sm text-slate-200">
                    <p className="font-semibold text-white">{instructor.name}</p>
                    {instructor.title && (
                      <p className="text-xs text-indigo-100">{instructor.title}</p>
                    )}
                    {instructor.bio && (
                      <p className="mt-2 text-xs text-slate-300">{instructor.bio}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-indigo-400/20 bg-indigo-500/15 p-6 text-sm text-indigo-100">
            <h3 className="text-lg font-semibold text-white">Capstone mission</h3>
            <p className="mt-2">
              Team up with peers to design an end-to-end AI product rollout. Present strategy decks, ethical guardrails,
              and success metrics to mentors for a final review.
            </p>
          </div>
        </aside>
      </Container>
    </div>
  );
};

export default CourseDetailPage;

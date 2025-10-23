import { useMemo, useState } from "react";
import { useParams, Navigate, Link } from "react-router-dom";
import {
  FiClock,
  FiPlayCircle,
  FiUsers,
  FiExternalLink,
  FiCheck,
} from "react-icons/fi";
import AccentButton from "../components/common/AccentButton";
import Container from "../components/common/Container";
import PageHeader from "../components/common/PageHeader";
import { useCourseDetail } from "../hooks/useCourseDetail";
import { useAuth } from "../context/AuthContext";
import { universityService } from "../services/useCases/universityService";

const CourseDetailPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const { course, loading, refetch } = useCourseDetail(slug);
  const { user } = useAuth();
  const [enrolling, setEnrolling] = useState(false);
  const [enrollError, setEnrollError] = useState<string | null>(null);
  const renderContent = useMemo(
    () => (content?: string | null) =>
      content
        ? content
            .trim()
            .split(/\n{2,}/)
            .map((block, index) => (
              <p key={index} className="text-xs leading-6 text-slate-300">
                {block.split("\n").map((line, lineIndex) => (
                  <span key={lineIndex}>
                    {line}
                    {lineIndex < block.split("\n").length - 1 && <br />}
                  </span>
                ))}
              </p>
            ))
        : null,
    []
  );

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
        eyebrow={course.category ?? undefined}
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
            {course.contentLocked ? (
              user ? (
                <button
                  onClick={async () => {
                    if (!slug) return;
                    setEnrollError(null);
                    setEnrolling(true);
                    try {
                      await universityService.enrollInCourse(slug);
                      await refetch();
                    } catch (error) {
                      setEnrollError(
                        "Unable to enroll right now. Please try again."
                      );
                    } finally {
                      setEnrolling(false);
                    }
                  }}
                  disabled={enrolling}
                  className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-blue-500 px-5 py-3 text-sm font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {enrolling ? "Enrolling…" : "Enroll to unlock"}
                </button>
              ) : (
                <AccentButton
                  to={`/signin?redirect=/courses/${slug}`}
                  icon={<FiExternalLink />}
                >
                  Sign in to enroll
                </AccentButton>
              )
            ) : user ? (
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/40 bg-emerald-500/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-emerald-200">
                <FiCheck /> Enrolled
              </div>
            ) : (
              <AccentButton
                to={`/signin?redirect=/courses/${slug}`}
                icon={<FiExternalLink />}
              >
                Sign in
              </AccentButton>
            )}
            {!course.contentLocked && user && (
              <AccentButton
                variant="secondary"
                to={`/university/courses/${course.slug}`}
              >
                Open workspace
              </AccentButton>
            )}
            <AccentButton variant="secondary" to="/practice">
              Practice companion
            </AccentButton>
          </>
        }
      />

      <Container className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-6">
          {enrollError && (
            <p className="rounded-3xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
              {enrollError}
            </p>
          )}

          {course.contentLocked ? (
            <div className="rounded-[2.5rem] border border-indigo-400/30 bg-indigo-500/10 p-8 text-sm text-indigo-100">
              <h2 className="text-2xl font-semibold text-white">
                Enroll to unlock full syllabus
              </h2>
              <p className="mt-3 text-sm text-indigo-100">
                Modules, mentor notes, and Simulation Studio missions are
                available once you enroll in this program.
              </p>
              {!user && (
                <AccentButton
                  to={`/signin?redirect=/courses/${slug}`}
                  className="mt-4"
                  icon={<FiExternalLink />}
                >
                  Sign in to enroll
                </AccentButton>
              )}
            </div>
          ) : (
            <>
              <div className="rounded-[2.5rem] border border-white/10 bg-white/5 p-8">
                <h2 className="text-2xl font-semibold text-white">
                  What you’ll master
                </h2>
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
                        <h3 className="text-lg font-semibold text-white">
                          {module.title}
                        </h3>
                      </div>
                      {module.duration && (
                        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-indigo-100">
                          {module.duration}
                        </span>
                      )}
                    </div>
                    {module.description && (
                      <p className="mt-2 text-sm text-slate-300">
                        {module.description}
                      </p>
                    )}
                    {module.items.length > 0 && (
                      <ul className="mt-3 space-y-3 text-sm text-slate-200">
                        {module.items.map((item) => (
                          <li
                            key={item.id ?? item.title}
                            className="space-y-2 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3"
                          >
                            <p className="font-medium text-white">
                              {item.title}
                            </p>
                            {item.description && (
                              <p className="text-xs text-slate-300">
                                {item.description}
                              </p>
                            )}
                            {renderContent(item.content)}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        <aside className="space-y-6">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <h3 className="text-lg font-semibold text-white">
              Meet your instructors
            </h3>
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
                    <p className="font-semibold text-white">
                      {instructor.name}
                    </p>
                    {instructor.title && (
                      <p className="text-xs text-indigo-100">
                        {instructor.title}
                      </p>
                    )}
                    {instructor.bio && (
                      <p className="mt-2 text-xs text-slate-300">
                        {instructor.bio}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-indigo-400/20 bg-indigo-500/15 p-6 text-sm text-indigo-100">
            <h3 className="text-lg font-semibold text-white">
              Capstone mission
            </h3>
            <p className="mt-2">
              Team up with peers to design an end-to-end AI product rollout.
              Present strategy decks, ethical guardrails, and success metrics to
              mentors for a final review.
            </p>
            {course.contentLocked && (
              <Link
                to={`/signin?redirect=/courses/${slug}`}
                className="mt-3 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.3em] text-indigo-200"
              >
                Enroll to access
              </Link>
            )}
          </div>
        </aside>
      </Container>

      {course.practiceSets && course.practiceSets.length > 0 && (
        <Container className="space-y-4">
          <h2 className="text-2xl font-semibold text-white">Practice sets</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {course.practiceSets.map((practice) => (
              <div
                key={practice.id}
                className="space-y-3 rounded-[2.5rem] border border-white/10 bg-white/5 p-6 text-sm text-slate-200"
              >
                <div>
                  <span className="text-xs font-semibold uppercase tracking-[0.3em] text-indigo-200">
                    Practice
                  </span>
                  <h3 className="mt-2 text-lg font-semibold text-white">
                    {practice.title}
                  </h3>
                </div>
                {practice.description && (
                  <p className="text-xs text-slate-300">
                    {practice.description}
                  </p>
                )}
                <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-xs text-indigo-100">
                  {practice.questions.length} question
                  {practice.questions.length === 1 ? "" : "s"} included
                </div>
                {course.contentLocked ? (
                  <AccentButton
                    to={`/signin?redirect=/courses/${course.slug}`}
                    variant="secondary"
                  >
                    Sign in to practice
                  </AccentButton>
                ) : (
                  <AccentButton
                    to={`/practice?set=${practice.slug ?? practice.id}`}
                    variant="secondary"
                  >
                    Open practice set
                  </AccentButton>
                )}
              </div>
            ))}
          </div>
        </Container>
      )}
    </div>
  );
};

export default CourseDetailPage;

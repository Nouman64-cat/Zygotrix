import { useState } from "react";
import {
  FiX,
  FiBook,
  FiClock,
  FiLayers,
  FiAward,
  FiCheckCircle,
  FiList,
} from "react-icons/fi";
import type { Course } from "../../types";
import { cn } from "../../utils/cn";

interface CourseDetailModalProps {
  course: Course;
  onClose: () => void;
  onEnroll: (courseSlug: string) => Promise<void>;
}

const CourseDetailModal = ({
  course,
  onClose,
  onEnroll,
}: CourseDetailModalProps) => {
  const [enrolling, setEnrolling] = useState(false);
  const [expandedModules, setExpandedModules] = useState<Set<string>>(
    new Set()
  );

  const handleEnroll = async () => {
    try {
      setEnrolling(true);
      await onEnroll(course.slug);
    } catch (error) {
      console.error("Enrollment failed:", error);
      alert("Failed to enroll in course. Please try again.");
    } finally {
      setEnrolling(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="relative w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-3xl border-2 border-accent bg-surface shadow-2xl animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b-2 border-border bg-surface/95 backdrop-blur-sm p-6">
          <div className="flex-1 space-y-3">
            {/* Category & Level */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-2 rounded-full border border-border bg-background-subtle px-3 py-1.5 text-xs font-medium text-accent">
                <FiBook className="h-3 w-3" />
                {course.category || "Course"}
              </span>
              {course.level && (
                <span className="inline-flex items-center gap-1 rounded-full bg-accent-soft px-3 py-1.5 text-xs font-medium text-accent">
                  <FiAward className="h-3 w-3" />
                  {course.level}
                </span>
              )}
            </div>

            {/* Title */}
            <h2 className="text-2xl font-bold text-foreground lg:text-3xl">
              {course.title}
            </h2>

            {/* Description */}
            {course.shortDescription && (
              <p className="text-sm text-muted leading-relaxed">
                {course.shortDescription}
              </p>
            )}

            {/* Stats */}
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <FiList className="h-4 w-4 text-muted" />
                <span className="text-xs text-muted">
                  <strong className="text-foreground">{course.lessons}</strong>{" "}
                  lessons
                </span>
              </div>
              {course.duration && (
                <div className="flex items-center gap-2">
                  <FiClock className="h-4 w-4 text-muted" />
                  <span className="text-xs text-muted">
                    <strong className="text-foreground">
                      {course.duration}
                    </strong>
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Close Button */}
          <button
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-border bg-background-subtle text-muted transition-all hover:border-accent hover:bg-accent-soft hover:text-accent"
            aria-label="Close"
          >
            <FiX className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div
          className="overflow-y-auto p-6 lg:p-8 space-y-6"
          style={{ maxHeight: "calc(90vh - 220px)" }}
        >
          {/* Long Description */}
          {course.longDescription && (
            <div className="rounded-2xl border border-border bg-background-subtle p-6">
              <h3 className="text-lg font-semibold text-foreground mb-3">
                About this course
              </h3>
              <p className="text-sm text-muted leading-relaxed whitespace-pre-line">
                {course.longDescription}
              </p>
            </div>
          )}

          {/* Outcomes */}
          {course.outcomes && course.outcomes.length > 0 && (
            <div className="rounded-2xl border border-border bg-background-subtle p-6">
              <h3 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
                <FiCheckCircle className="h-5 w-5 text-accent" />
                What you'll learn
              </h3>
              <ul className="space-y-2">
                {course.outcomes.map((outcome) => (
                  <li
                    key={outcome.id}
                    className="flex items-start gap-3 text-sm text-muted"
                  >
                    <FiCheckCircle className="h-4 w-4 text-accent mt-0.5 flex-shrink-0" />
                    <span>{outcome.text}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Instructors */}
          {course.instructors && course.instructors.length > 0 && (
            <div className="rounded-2xl border border-border bg-background-subtle p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">
                Instructors
              </h3>
              <div className="space-y-4">
                {course.instructors.map((instructor) => (
                  <div key={instructor.id} className="flex items-start gap-4">
                    {instructor.avatar && (
                      <img
                        src={instructor.avatar}
                        alt={instructor.name}
                        className="h-12 w-12 rounded-full object-cover"
                      />
                    )}
                    <div className="flex-1">
                      <p className="font-semibold text-foreground">
                        {instructor.name}
                      </p>
                      {instructor.title && (
                        <p className="text-xs text-muted">{instructor.title}</p>
                      )}
                      {instructor.bio && (
                        <p className="text-sm text-muted mt-1">
                          {instructor.bio}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 border-t-2 border-border bg-surface/95 backdrop-blur-sm p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs text-muted mb-1">
                Ready to start learning?
              </p>
              <p className="text-sm font-semibold text-foreground">
                Enroll now and get instant access
              </p>
            </div>
            <button
              onClick={handleEnroll}
              disabled={enrolling}
              className={cn(
                "inline-flex items-center justify-center gap-2 rounded-xl px-8 py-3 text-sm font-semibold transition-all",
                "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg",
                "hover:scale-105 hover:shadow-xl",
                "focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2",
                "disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:scale-100"
              )}
            >
              {enrolling ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Enrolling...
                </>
              ) : (
                <>
                  <FiCheckCircle className="h-5 w-5" />
                  Enroll in Course
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseDetailModal;

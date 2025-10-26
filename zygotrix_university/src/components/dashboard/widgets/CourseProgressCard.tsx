import { FiArrowRight, FiClock, FiPlayCircle } from "react-icons/fi";
import type { CourseProgress } from "../../../types";
import AccentButton from "../../common/AccentButton";

interface CourseProgressCardProps {
  course: CourseProgress;
}

const CourseProgressCard = ({ course }: CourseProgressCardProps) => {
  return (
    <div className="space-y-4 rounded-[1.75rem] border border-border bg-dashboard-card p-6 shadow-theme-card transition-colors">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          {course.category && (
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-accent">
              {course.category}
            </p>
          )}
          <h3 className="mt-2 text-lg font-semibold text-foreground">
            {course.title}
          </h3>
          {course.instructor && (
            <p className="text-xs text-muted">
              Instructor · {course.instructor}
            </p>
          )}
        </div>
        <div className="flex flex-col items-end">
          <span className="text-3xl font-semibold text-foreground">
            {course.progress}%
          </span>
          <p className="text-[11px] uppercase tracking-[0.24em] text-muted">
            Complete
          </p>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-3 rounded-[1.25rem] border border-border bg-background-subtle px-4 py-3 text-xs text-muted transition-colors">
        {course.nextSession && (
          <span className="inline-flex items-center gap-2">
            <FiClock /> {course.nextSession}
          </span>
        )}
        {course.level && (
          <span className="inline-flex items-center gap-2">
            <FiPlayCircle /> Level {course.level}
          </span>
        )}
      </div>
      <div className="space-y-2">
        {course.modules.map((module) => (
          <div key={module.moduleId} className="flex items-center gap-3">
            <div className="relative h-2 flex-1 rounded-full bg-accent-soft">
              <div
                className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-indigo-400 to-purple-400"
                style={{ width: `${module.completion}%` }}
              />
            </div>
            <span className="w-12 text-xs text-muted">
              {module.completion}%
            </span>
            <span className="w-40 text-xs text-muted">
              {module.title ?? "Module"}
            </span>
          </div>
        ))}
      </div>
      <AccentButton
        to={`/university/courses/${course.courseSlug ?? course.title}`}
        variant="secondary"
        icon={<FiArrowRight />}
      >
        Continue learning
      </AccentButton>
    </div>
  );
};

export default CourseProgressCard;

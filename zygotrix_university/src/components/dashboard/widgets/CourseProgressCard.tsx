import { FiArrowRight, FiClock, FiPlayCircle } from "react-icons/fi";
import type { CourseProgress } from "../../../types";
import AccentButton from "../../common/AccentButton";

interface CourseProgressCardProps {
  course: CourseProgress;
}

const CourseProgressCard = ({ course }: CourseProgressCardProps) => {
  return (
    <div className="space-y-4 rounded-[1.75rem] border border-white/10 bg-gradient-to-br from-indigo-500/15 via-[#0b1327] to-[#080d1c] p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-indigo-200">
            {course.category}
          </p>
          <h3 className="mt-2 text-lg font-semibold text-white">{course.title}</h3>
          <p className="text-xs text-indigo-100">Instructor · {course.instructor}</p>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-3xl font-semibold text-white">{course.progress}%</span>
          <p className="text-[11px] uppercase tracking-[0.24em] text-slate-400">Complete</p>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-3 rounded-[1.25rem] border border-white/10 bg-white/5 px-4 py-3 text-xs text-slate-200">
        <span className="inline-flex items-center gap-2">
          <FiClock /> {course.nextSession}
        </span>
        <span className="inline-flex items-center gap-2">
          <FiPlayCircle /> Level {course.level}
        </span>
      </div>
      <div className="space-y-2">
        {course.modules.map((module) => (
          <div key={module.id} className="flex items-center gap-3">
            <div className="relative h-2 flex-1 rounded-full bg-white/10">
              <div
                className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-indigo-400 to-purple-400"
                style={{ width: `${module.completion}%` }}
              />
            </div>
            <span className="w-12 text-xs text-slate-400">{module.completion}%</span>
            <span className="w-40 text-xs text-slate-200">{module.title}</span>
          </div>
        ))}
      </div>
      <AccentButton to={`/dashboard/courses/${course.id}`} variant="secondary" icon={<FiArrowRight />}>
        Continue learning
      </AccentButton>
    </div>
  );
};

export default CourseProgressCard;

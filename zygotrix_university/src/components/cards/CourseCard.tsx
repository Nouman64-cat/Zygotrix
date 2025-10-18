import { FiClock, FiUsers, FiPlayCircle, FiStar } from "react-icons/fi";
import type { Course } from "../../types";
import AccentButton from "../common/AccentButton";

interface CourseCardProps {
  course: Course;
  variant?: "default" | "compact";
}

const CourseCard = ({ course, variant = "default" }: CourseCardProps) => {
  return (
    <div className="group relative overflow-hidden rounded-3xl border border-white/8 bg-gradient-to-b from-white/5 to-white/2 p-6 transition duration-300 hover:border-indigo-400/50 hover:shadow-2xl hover:shadow-indigo-500/20">
      <div className="absolute inset-x-6 top-6 flex justify-between text-xs uppercase tracking-[0.3em] text-indigo-200">
        <span>{course.category}</span>
        <span className="rounded-full border border-indigo-300/40 px-3 py-1 text-[10px] font-semibold text-indigo-100">
          {course.badge}
        </span>
      </div>
      <div className="aspect-[16/10] overflow-hidden rounded-2xl">
        <img
          src={course.image}
          alt={course.title}
          className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.05]"
          loading="lazy"
        />
      </div>
      <div className="mt-6 space-y-4">
        <div className="space-y-2">
          <h3 className="text-xl font-semibold text-white">{course.title}</h3>
          <p className="text-sm text-slate-300 line-clamp-3">{course.description}</p>
        </div>
        <div className="grid grid-cols-2 gap-3 text-xs text-slate-300">
          <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-2">
            <FiClock />
            <span>{course.duration}</span>
          </div>
          <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-2">
            <FiPlayCircle />
            <span>{course.lessons} lessons</span>
          </div>
          <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-2">
            <FiUsers />
            <span>{course.students.toLocaleString()} learners</span>
          </div>
          <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-2">
            <FiStar className="text-amber-300" />
            <span>{course.rating.toFixed(2)} rating</span>
          </div>
        </div>
        {variant === "default" && (
          <div className="flex flex-wrap items-center gap-4 pt-2">
            <div className="flex -space-x-3 overflow-hidden">
              {course.instructors.slice(0, 3).map((instructor) => (
                <img
                  key={instructor.id}
                  src={instructor.avatar}
                  alt={instructor.name}
                  className="h-10 w-10 rounded-full border-2 border-[#03050f] object-cover"
                />
              ))}
            </div>
            <AccentButton to={`/courses/${course.id}`} className="shrink-0">
              View Program
            </AccentButton>
          </div>
        )}
      </div>
    </div>
  );
};

export default CourseCard;

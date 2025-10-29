import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import Confetti from "react-confetti";
import {
  FiSearch,
  FiFilter,
  FiX,
  FiBook,
  FiClock,
  FiLayers,
  FiAward,
  FiCheckCircle,
  FiMail,
} from "react-icons/fi";
import type { Course } from "../../types";
import { universityService } from "../../services/useCases/universityService";
import CourseDetailModal from "../../components/dashboard/CourseDetailModal.js";

const BrowseCoursesPage = () => {
  const navigate = useNavigate();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedLevel, setSelectedLevel] = useState<string>("all");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [enrolledCourseName, setEnrolledCourseName] = useState("");
  const [enrollingSlug, setEnrollingSlug] = useState<string | null>(null);
  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  // Load courses and enrollments
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [allCourses, enrollments] = await Promise.all([
          universityService.getCourses(),
          universityService.getEnrollments(),
        ]);

        // Filter out enrolled courses
        const enrolledSet = new Set(enrollments);
        const availableCourses = allCourses.filter(
          (course) => !enrolledSet.has(course.slug)
        );
        setCourses(availableCourses);
      } catch (error) {
        console.error("Failed to load courses:", error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // Window resize effect for confetti
  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Extract unique categories and levels
  const categories = useMemo(() => {
    const cats = new Set(
      courses
        .map((c) => c.category)
        .filter((cat): cat is string => Boolean(cat))
    );
    return ["all", ...Array.from(cats)];
  }, [courses]);

  const levels = useMemo(() => {
    const lvls = new Set(
      courses.map((c) => c.level).filter((lvl): lvl is string => Boolean(lvl))
    );
    return ["all", ...Array.from(lvls)];
  }, [courses]);

  // Filter courses
  const filteredCourses = useMemo(() => {
    return courses.filter((course) => {
      // Search filter
      const matchesSearch =
        searchQuery === "" ||
        course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        course.shortDescription
          ?.toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        course.category?.toLowerCase().includes(searchQuery.toLowerCase());

      // Category filter
      const matchesCategory =
        selectedCategory === "all" || course.category === selectedCategory;

      // Level filter
      const matchesLevel =
        selectedLevel === "all" || course.level === selectedLevel;

      return matchesSearch && matchesCategory && matchesLevel;
    });
  }, [courses, searchQuery, selectedCategory, selectedLevel]);

  // Active filter count
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (selectedCategory !== "all") count++;
    if (selectedLevel !== "all") count++;
    return count;
  }, [selectedCategory, selectedLevel]);

  const handleEnroll = async (courseSlug: string) => {
    try {
      setEnrollingSlug(courseSlug);
      const courseToEnroll = courses.find((c) => c.slug === courseSlug);
      await universityService.enrollInCourse(courseSlug);

      // Show success toast
      toast.success(
        () => (
          <div className="flex items-start gap-3">
            <div>
              <p className="font-semibold text-foreground">
                Successfully enrolled!
              </p>
              <p className="text-sm text-muted mt-1">
                A confirmation email has been sent to you.
              </p>
            </div>
          </div>
        ),
        {
          duration: 4000,
          position: "top-center",
          style: {
            background: "var(--color-surface)",
            color: "var(--color-foreground)",
            border: "1px solid var(--color-border)",
            padding: "16px",
            borderRadius: "12px",
            maxWidth: "500px",
          },
        }
      );

      // Show confetti and success message
      setEnrolledCourseName(courseToEnroll?.title || "");
      setShowSuccess(true);
      setShowConfetti(true);

      // Auto redirect after 3 seconds
      setTimeout(() => {
        setShowConfetti(false);
        navigate("/university/courses");
      }, 3000);

      // Remove from available courses
      setCourses((prev) => prev.filter((c) => c.slug !== courseSlug));
      setSelectedCourse(null);
    } catch (error) {
      console.error("Enrollment failed:", error);
      toast.error("Failed to enroll in course. Please try again.", {
        duration: 4000,
        position: "top-center",
      });
    } finally {
      setEnrollingSlug(null);
    }
  };

  const clearFilters = () => {
    setSelectedCategory("all");
    setSelectedLevel("all");
    setSearchQuery("");
  };

  // Success feedback overlay
  if (showSuccess) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        {showConfetti && (
          <Confetti
            width={windowSize.width}
            height={windowSize.height}
            recycle={false}
            numberOfPieces={500}
            gravity={0.3}
          />
        )}
        <div className="relative bg-surface rounded-3xl border-2 border-accent p-8 max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-200">
          <div className="text-center space-y-6">
            <div className="mx-auto w-20 h-20 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center">
              <FiCheckCircle className="w-12 h-12 text-white" />
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-bold text-foreground">
                Enrollment Successful! 🎉
              </h3>
              <p className="text-muted">
                You've successfully enrolled in{" "}
                <strong>{enrolledCourseName}</strong>
              </p>
              <div className="flex items-center justify-center gap-2 text-sm text-accent mt-3">
                <FiMail className="h-4 w-4" />
                <span>Confirmation email sent</span>
              </div>
            </div>
            <div className="text-sm text-muted">
              Redirecting you to your courses...
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="h-40 animate-pulse rounded-[1.75rem] border border-border bg-background-subtle" />
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-80 animate-pulse rounded-[1.75rem] border border-border bg-background-subtle"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="rounded-[1.75rem] border border-border bg-surface p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-accent">
              Course Catalog
            </p>
            <h1 className="mt-2 text-2xl font-semibold text-foreground">
              Browse Available Courses
            </h1>
            <p className="text-sm text-muted mt-1">
              Discover and enroll in courses to expand your knowledge
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted">
              {filteredCourses.length} courses available
            </span>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="space-y-4">
        {/* Search Bar */}
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <FiSearch className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search courses by title, description, or category..."
              className="w-full rounded-xl border border-border bg-surface px-12 py-3 text-sm text-foreground placeholder:text-muted focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted hover:text-foreground transition-colors"
              >
                <FiX className="h-5 w-5" />
              </button>
            )}
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center justify-center gap-2 rounded-xl border border-border bg-surface px-6 py-3 text-sm font-medium text-foreground transition-all hover:border-accent hover:bg-accent-soft"
          >
            <FiFilter className="h-5 w-5" />
            Filters
            {activeFilterCount > 0 && (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-accent text-xs font-bold text-white">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <div className="rounded-xl border border-border bg-surface p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground">
                Filter Options
              </h3>
              {activeFilterCount > 0 && (
                <button
                  onClick={clearFilters}
                  className="text-xs font-medium text-accent hover:text-foreground transition-colors"
                >
                  Clear all
                </button>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {/* Category Filter */}
              <div>
                <label className="block text-xs font-medium text-muted mb-2">
                  Category
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background-subtle px-3 py-2 text-sm text-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat === "all"
                        ? "All Categories"
                        : cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Level Filter */}
              <div>
                <label className="block text-xs font-medium text-muted mb-2">
                  Level
                </label>
                <select
                  value={selectedLevel}
                  onChange={(e) => setSelectedLevel(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background-subtle px-3 py-2 text-sm text-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                >
                  {levels.map((lvl) => (
                    <option key={lvl} value={lvl}>
                      {lvl === "all" ? "All Levels" : lvl}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Active Filters Display */}
        {activeFilterCount > 0 && (
          <div className="flex flex-wrap gap-2">
            {selectedCategory !== "all" && (
              <span className="inline-flex items-center gap-2 rounded-full border border-accent/20 bg-accent-soft px-3 py-1 text-xs font-medium text-accent">
                Category: {selectedCategory}
                <button
                  onClick={() => setSelectedCategory("all")}
                  className="hover:text-foreground transition-colors"
                >
                  <FiX className="h-3 w-3" />
                </button>
              </span>
            )}
            {selectedLevel !== "all" && (
              <span className="inline-flex items-center gap-2 rounded-full border border-accent/20 bg-accent-soft px-3 py-1 text-xs font-medium text-accent">
                Level: {selectedLevel}
                <button
                  onClick={() => setSelectedLevel("all")}
                  className="hover:text-foreground transition-colors"
                >
                  <FiX className="h-3 w-3" />
                </button>
              </span>
            )}
          </div>
        )}
      </div>

      {/* Course Grid */}
      {filteredCourses.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <FiBook className="h-16 w-16 text-muted mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">
            No courses found
          </h3>
          <p className="text-sm text-muted mb-4">
            Try adjusting your search or filters
          </p>
          {(searchQuery || activeFilterCount > 0) && (
            <button
              onClick={clearFilters}
              className="text-sm font-medium text-accent hover:text-foreground transition-colors"
            >
              Clear all filters
            </button>
          )}
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2  lg:grid-cols-4">
          {filteredCourses.map((course) => (
            <div
              key={course.slug}
              className="group flex flex-col rounded-[1.75rem] border border-border bg-surface p-6 transition-all hover:border-accent hover:shadow-lg hover:scale-[1.02]"
            >
              <div className="w-full h-40 mb-4 rounded-xl overflow-hidden bg-background-subtle flex items-center justify-center">
                {course.imageUrl ? (
                  <img
                    src={course.imageUrl}
                    alt={course.title}
                    className="object-cover w-full h-full"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted text-2xl">
                    <FiBook />
                  </div>
                )}
              </div>
              {/* Course Badge */}
              <div className="flex items-center justify-between mb-4">
                <span className="inline-flex items-center gap-2 rounded-full border border-border bg-background-subtle px-3 py-1.5 text-xs font-medium text-accent transition-colors group-hover:border-accent group-hover:bg-accent-soft">
                  <FiBook className="h-3 w-3" />
                  {course.category || "Course"}
                </span>
                {course.level && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-accent-soft px-2 py-1 text-xs font-medium text-accent">
                    <FiAward className="h-3 w-3" />
                    {course.level}
                  </span>
                )}
              </div>

              {/* Course Title */}
              <h3 className="text-lg font-semibold text-foreground mb-2 line-clamp-2 group-hover:text-accent transition-colors">
                {course.title}
              </h3>

              {/* Description */}
              {course.shortDescription && (
                <p className="text-xs text-muted mb-4 line-clamp-3 flex-grow">
                  {course.shortDescription}
                </p>
              )}

              {/* Instructor Info */}
              {course.instructors && course.instructors.length > 0 && (
                <div className="flex items-center gap-2 mb-4 pb-4 border-b border-border">
                  {course.instructors[0].avatar && (
                    <img
                      src={course.instructors[0].avatar}
                      alt={course.instructors[0].name}
                      className="h-8 w-8 rounded-full object-cover"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-foreground truncate">
                      {course.instructors[0].name}
                    </p>
                    {course.instructors[0].title && (
                      <p className="text-xs text-muted truncate">
                        {course.instructors[0].title}
                      </p>
                    )}
                  </div>
                  {course.instructors.length > 1 && (
                    <span className="text-xs text-muted">
                      +{course.instructors.length - 1}
                    </span>
                  )}
                </div>
              )}

              {/* Course Stats */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="flex items-center gap-2">
                  <FiLayers className="h-4 w-4 text-muted" />
                  <div>
                    <p className="text-xs text-muted">Lessons</p>
                    <p className="text-sm font-semibold text-foreground">
                      {course.modulesCount ?? course.lessons}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <FiClock className="h-4 w-4 text-muted" />
                  <div>
                    <p className="text-xs text-muted">Duration</p>
                    <p className="text-sm font-semibold text-foreground">
                      {course.duration || "Self-paced"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-2 mt-auto pt-4 border-t border-border">
                <button
                  onClick={() => setSelectedCourse(course)}
                  className="px-4 py-2 text-xs font-medium text-accent border border-accent rounded-xl hover:bg-accent-soft transition-colors cursor-pointer disabled:cursor-not-allowed"
                  disabled={enrollingSlug === course.slug}
                >
                  View Details
                </button>
                <button
                  onClick={() => handleEnroll(course.slug)}
                  disabled={enrollingSlug === course.slug}
                  className="px-4 py-2 text-xs font-medium text-white bg-accent rounded-xl hover:bg-accent/90 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {enrollingSlug === course.slug ? (
                    <>
                      <svg
                        className="animate-spin h-4 w-4"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Enrolling...
                    </>
                  ) : (
                    "Enroll Now"
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Course Detail Modal */}
      {selectedCourse && (
        <CourseDetailModal
          course={selectedCourse}
          onClose={() => setSelectedCourse(null)}
          onEnroll={handleEnroll}
        />
      )}
    </div>
  );
};

export default BrowseCoursesPage;

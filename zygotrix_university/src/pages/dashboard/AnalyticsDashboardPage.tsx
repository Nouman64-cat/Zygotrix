import {
  FiTrendingUp,
  FiPlay,
  FiAward,
  FiDownload,
  FiCheckCircle,
  FiClock,
  FiBookOpen,
} from "react-icons/fi";
import { Link } from "react-router-dom";
import { useDashboardSummary } from "../../hooks/useDashboardSummary";
import AccentButton from "../../components/common/AccentButton";
import { useState } from "react";
import toast from "react-hot-toast";
import CourseCertificate from "../../components/certificates/CourseCertificate";
import { generateCertificate } from "../../services/repositories/universityRepository";

const AnalyticsDashboardPage = () => {
  const { summary } = useDashboardSummary();

  const [offscreenCert, setOffscreenCert] = useState<{
    userName: string;
    courseName: string;
    completedAt: Date;
  } | null>(null);

  if (!summary) {
    return (
      <div className="space-y-8">
        <div className="flex h-40 animate-pulse rounded-[1.75rem] border border-border bg-background-subtle" />
        <div className="grid gap-6 lg:grid-cols-2">
          {Array.from({ length: 2 }).map((_, index) => (
            <div
              key={index}
              className="h-96 animate-pulse rounded-[1.75rem] border border-border bg-background-subtle"
            />
          ))}
        </div>
      </div>
    );
  }

  const inProgressCourses = summary.courses.filter(
    (course) => course.progress > 0 && course.progress < 100
  );

  const completedCourses = summary.courses.filter(
    (course) => course.progress >= 100
  );

  const handleDownloadCertificate = async (courseSlug: string) => {
    try {
      const cert = await generateCertificate(courseSlug);
      setOffscreenCert({
        userName: cert.userName,
        courseName: cert.courseName,
        completedAt: new Date(cert.completedAt),
      });
      // Wait for the component to render, then trigger download
      setTimeout(() => {
        requestAnimationFrame(() => {
          const certDiv = document.getElementById("certificate");
          if (!certDiv) return;
          import("html2canvas").then(({ default: html2canvas }) =>
            import("jspdf").then(({ default: jsPDF }) => {
              html2canvas(certDiv, {
                scale: 2,
                useCORS: true,
                backgroundColor: "#fff",
              }).then((canvas) => {
                const imgWidth = 297;
                const imgHeight = (canvas.height * imgWidth) / canvas.width;
                const pdf = new jsPDF({
                  orientation: imgHeight > imgWidth ? "portrait" : "landscape",
                  unit: "mm",
                  format: "a4",
                });
                const imgData = canvas.toDataURL("image/png");
                pdf.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight);
                const filename = `${cert.userName.replace(
                  /\s+/g,
                  "_"
                )}_${cert.courseName
                  .replace(/\s+/g, "_")
                  .substring(0, 30)}_Certificate.pdf`;
                pdf.save(filename);
                toast.success("Certificate downloaded!");
                setOffscreenCert(null);
              });
            })
          );
        });
      }, 350);
    } catch {
      alert("Failed to generate certificate. Please try again.");
    }
  };

  return (
    <div className="space-y-8">
      {/* Offscreen Certificate for instant download */}
      {offscreenCert && (
        <div
          style={{
            position: "absolute",
            left: -9999,
            top: 0,
            overflow: "hidden",
            // No width/height 0, allow natural size
          }}
        >
          <CourseCertificate
            userName={offscreenCert.userName}
            courseName={offscreenCert.courseName}
            completedAt={offscreenCert.completedAt}
          />
        </div>
      )}
      {/* Page Header */}
      <div className="flex flex-col gap-4 rounded-[1.75rem] border border-border bg-surface p-6 transition-colors md:flex-row md:items-center md:justify-between">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-background-subtle px-3 py-1 text-xs text-accent transition-colors">
            <FiTrendingUp /> Course Analytics
          </span>
          <h2 className="mt-3 text-2xl font-semibold text-foreground">
            Your Learning Progress
          </h2>
          <p className="text-sm text-muted">
            Track your course progress, access workspaces, and download
            certificates for completed courses.
          </p>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-[1.5rem] border border-border bg-surface p-5 transition-colors">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-accent-soft p-3">
              <FiClock className="h-5 w-5 text-accent" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">
                {inProgressCourses.length}
              </p>
              <p className="text-xs text-muted">In Progress</p>
            </div>
          </div>
        </div>

        <div className="rounded-[1.5rem] border border-border bg-surface p-5 transition-colors">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-emerald-500/10 p-3">
              <FiCheckCircle className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">
                {completedCourses.length}
              </p>
              <p className="text-xs text-muted">Completed</p>
            </div>
          </div>
        </div>

        <div className="rounded-[1.5rem] border border-border bg-surface p-5 transition-colors">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-blue-500/10 p-3">
              <FiBookOpen className="h-5 w-5 text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">
                {summary.courses.length}
              </p>
              <p className="text-xs text-muted">Total Enrolled</p>
            </div>
          </div>
        </div>
      </div>

      {/* In Progress Courses */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-foreground">
            Courses In Progress
          </h3>
          <span className="text-sm text-muted">
            {inProgressCourses.length} course
            {inProgressCourses.length !== 1 ? "s" : ""}
          </span>
        </div>

        {inProgressCourses.length === 0 ? (
          <div className="rounded-[1.75rem] border border-border bg-surface p-12 text-center transition-colors">
            <FiClock className="mx-auto h-12 w-12 text-muted opacity-50" />
            <p className="mt-4 text-sm text-muted">
              No courses in progress. Start learning from your{" "}
              <Link
                to="/university/courses"
                className="text-accent hover:underline"
              >
                enrolled courses
              </Link>
              .
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {inProgressCourses.map((course) => {
              const completedModules = course.modules.filter(
                (m) => m.status === "completed"
              ).length;
              const totalModules = course.modules.length;

              return (
                <div
                  key={course.courseSlug}
                  className="group rounded-[1.75rem] border border-border bg-surface p-6 transition-all hover:border-accent hover:shadow-lg"
                >
                  <div className="mb-4 flex items-start justify-between">
                    <div className="flex-1">
                      <span className="inline-flex items-center gap-2 rounded-full border border-border bg-background-subtle px-3 py-1.5 text-xs font-medium text-accent transition-colors">
                        <FiBookOpen className="h-3 w-3" />
                        {course.category || course.level || "Course"}
                      </span>
                      <h4 className="mt-3 text-lg font-semibold text-foreground line-clamp-2">
                        {course.title}
                      </h4>
                      {course.instructor && (
                        <p className="mt-1 text-xs text-muted">
                          Instructor: {course.instructor}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-4">
                    <div className="mb-2 flex items-center justify-between text-xs">
                      <span className="text-muted">Progress</span>
                      <span className="font-semibold text-accent">
                        {Math.round(course.progress)}%
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-background-subtle">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-accent to-accent-secondary transition-all duration-500"
                        style={{ width: `${course.progress}%` }}
                      />
                    </div>
                    <p className="mt-2 text-xs text-muted">
                      {completedModules} of {totalModules} modules completed
                    </p>
                  </div>

                  {/* Action Button */}
                  <Link to={`/university/courses/${course.courseSlug}`}>
                    <AccentButton
                      icon={<FiPlay />}
                      variant="secondary"
                      className="w-full"
                    >
                      Continue Learning
                    </AccentButton>
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Completed Courses */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-foreground">
            Completed Courses
          </h3>
          <span className="text-sm text-muted">
            {completedCourses.length} course
            {completedCourses.length !== 1 ? "s" : ""}
          </span>
        </div>

        {completedCourses.length === 0 ? (
          <div className="rounded-[1.75rem] border border-border bg-surface p-12 text-center transition-colors">
            <FiAward className="mx-auto h-12 w-12 text-muted opacity-50" />
            <p className="mt-4 text-sm text-muted">
              No completed courses yet. Keep learning to earn your certificates!
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {completedCourses.map((course) => (
              <div
                key={course.courseSlug}
                className="group rounded-[1.75rem] border border-emerald-500/20 bg-surface p-6 transition-all hover:border-emerald-400 hover:shadow-lg"
              >
                <div className="mb-4 flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-400 transition-colors">
                        <FiCheckCircle className="h-3 w-3" />
                        Completed
                      </span>
                    </div>
                    <h4 className="mt-3 text-lg font-semibold text-foreground line-clamp-2">
                      {course.title}
                    </h4>
                    {course.instructor && (
                      <p className="mt-1 text-xs text-muted">
                        Instructor: {course.instructor}
                      </p>
                    )}
                  </div>
                  <FiAward className="h-8 w-8 text-emerald-400" />
                </div>

                {/* Completion Badge */}
                <div className="mb-4 rounded-[1.25rem] border border-emerald-500/20 bg-emerald-500/5 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold text-emerald-400">
                        100% Complete
                      </p>
                      <p className="text-xs text-muted">
                        All {course.modules.length} modules finished
                      </p>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <Link
                    to={`/university/courses/${course.courseSlug}`}
                    className="flex-1"
                  >
                    <AccentButton variant="secondary" className="w-full">
                      <FiBookOpen className="h-4 w-4" />
                      Review Course
                    </AccentButton>
                  </Link>
                  <button
                    onClick={() => handleDownloadCertificate(course.courseSlug)}
                    className="rounded-[1.25rem] border border-border bg-background-subtle px-4 py-2 text-sm font-medium text-accent transition-colors hover:border-accent hover:bg-accent-soft"
                  >
                    <FiDownload className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AnalyticsDashboardPage;

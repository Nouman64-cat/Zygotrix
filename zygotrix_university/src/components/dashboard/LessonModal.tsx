import { useEffect } from "react";
import { FiX, FiCheckCircle, FiBook } from "react-icons/fi";
import MarkdownContent from "../common/MarkdownContent";
import { cn } from "../../utils/cn";

interface LessonModalProps {
  isOpen: boolean;
  onClose: () => void;
  lesson: {
    title: string;
    content?: string | null;
    description?: string | null;
    video?: {
      fileName?: string | null;
      url?: string | null;
    } | null;
  } | null;
  module: {
    title: string;
    description?: string | null;
  } | null;
  isCompleted?: boolean;
  onToggleComplete?: () => void;
  isSaving?: boolean;
  isModuleOverview?: boolean;
}

const LessonModal = ({
  isOpen,
  onClose,
  lesson,
  module,
  isCompleted = false,
  onToggleComplete,
  isSaving = false,
  isModuleOverview = false,
}: LessonModalProps) => {
  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      // Prevent body scroll when modal is open
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  const renderContent = (content?: string | null) => {
    if (!content || !content.trim()) {
      return (
        <p className="text-sm text-muted">
          Lesson content will appear here soon.
        </p>
      );
    }
    return <MarkdownContent>{content}</MarkdownContent>;
  };

  if (!isOpen || !lesson) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="lesson-modal-title"
    >
      <div
        className={cn(
          "relative w-full max-w-4xl max-h-[90vh] overflow-hidden",
          "rounded-3xl border-2 border-accent bg-surface shadow-2xl",
          "animate-in zoom-in-95 duration-200"
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b-2 border-border bg-surface/95 backdrop-blur-sm p-6">
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-accent">
              <FiBook className="h-4 w-4" aria-hidden="true" />
              <span>Lesson</span>
            </div>
            <h2
              id="lesson-modal-title"
              className="text-2xl font-bold text-foreground lg:text-3xl"
            >
              {lesson.title}
            </h2>
            {module && <p className="text-sm text-muted">{module.title}</p>}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            {onToggleComplete && (
              <button
                type="button"
                onClick={onToggleComplete}
                disabled={isSaving}
                className={cn(
                  "inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-wider transition-all",
                  "focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-surface",
                  "disabled:cursor-not-allowed disabled:opacity-60",
                  isCompleted
                    ? "border-2 border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"
                    : "border-2 border-accent bg-accent-soft text-accent hover:bg-accent/20"
                )}
                aria-label={
                  isCompleted ? "Mark as incomplete" : "Mark as complete"
                }
              >
                <FiCheckCircle className="h-4 w-4" aria-hidden="true" />
                {isCompleted ? "Completed" : "Mark complete"}
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-border bg-background-subtle text-muted transition-all hover:border-accent hover:bg-accent-soft hover:text-accent focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-surface"
              aria-label="Close lesson"
            >
              <FiX className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div
          className="overflow-y-auto p-6 lg:p-8"
          style={{ maxHeight: "calc(90vh - 120px)" }}
        >
          {/* Video Player - Show if video URL exists */}
          {lesson.video?.url && (
            <div className="mb-6 overflow-hidden rounded-2xl border-2 border-border bg-black shadow-lg">
              <video
                src={lesson.video.url}
                controls
                controlsList="nodownload"
                className="w-full aspect-video"
                preload="metadata"
                playsInline
              >
                <track kind="captions" />
                Your browser does not support the video tag.
              </video>
              {lesson.video.fileName && (
                <div className="px-4 py-2 bg-surface/90 text-xs text-muted">
                  Video: {lesson.video.fileName}
                </div>
              )}
            </div>
          )}

          {/* Module Overview - Show if this is a module overview */}
          {isModuleOverview && module?.description && (
            <div className="mb-6 rounded-2xl border-2 border-accent/20 bg-accent-soft p-6">
              <h3 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
                <FiBook className="h-5 w-5 text-accent" />
                Module Overview
              </h3>
              <div className="prose prose-sm max-w-none">
                {renderContent(module.description)}
              </div>
            </div>
          )}

          {/* Lesson Content */}
          <div className="prose prose-sm max-w-none">
            {renderContent(lesson.content ?? lesson.description)}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LessonModal;

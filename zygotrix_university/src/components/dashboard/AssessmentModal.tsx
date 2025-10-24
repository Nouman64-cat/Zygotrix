import { useEffect, useMemo, useState } from "react";
import { FiX, FiAlertCircle } from "react-icons/fi";
import ReactMarkdown from "react-markdown";
import AccentButton from "../common/AccentButton";
import type { Assessment, AssessmentQuestion, UserAnswer } from "../../types";
import { cn } from "../../utils/cn";

interface AssessmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  assessment: Assessment;
  moduleTitle: string;
  onSubmit: (answers: UserAnswer[]) => Promise<void>;
  isSubmitting?: boolean;
}

interface ShuffledQuestion extends AssessmentQuestion {
  originalIndex: number;
  shuffledOptions: Array<{
    text: string;
    originalIndex: number;
  }>;
}

const AssessmentModal = ({
  isOpen,
  onClose,
  assessment,
  moduleTitle,
  onSubmit,
  isSubmitting = false,
}: AssessmentModalProps) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<
    Record<number, number>
  >({});
  const [showConfirmSubmit, setShowConfirmSubmit] = useState(false);

  // Shuffle options once when the modal opens
  const shuffledQuestions = useMemo<ShuffledQuestion[]>(() => {
    if (
      !assessment?.assessmentQuestions ||
      !Array.isArray(assessment.assessmentQuestions)
    ) {
      console.error("Assessment questions not found:", assessment);
      return [];
    }

    return assessment.assessmentQuestions.map((question, qIndex) => {
      const optionsWithIndex = question.options.map((opt, idx) => ({
        text: opt.text,
        originalIndex: idx,
      }));

      // Shuffle the options
      const shuffled = [...optionsWithIndex].sort(() => Math.random() - 0.5);

      return {
        ...question,
        originalIndex: qIndex,
        shuffledOptions: shuffled,
      };
    });
  }, [assessment]);

  const currentQuestion = shuffledQuestions[currentQuestionIndex];
  const totalQuestions = shuffledQuestions.length;
  const allAnswered = Object.keys(selectedAnswers).length === totalQuestions;

  // Show error if no questions available
  if (!isOpen) return null;

  if (shuffledQuestions.length === 0) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
        <div className="w-full max-w-2xl rounded-2xl bg-background-elevated p-6">
          <div className="flex items-center gap-3 text-amber-400">
            <FiAlertCircle className="h-6 w-6" />
            <p className="text-lg font-semibold">
              No assessment questions available
            </p>
          </div>
          <p className="mt-2 text-muted">
            This module's assessment is not yet configured. Please contact your
            instructor.
          </p>
          <div className="mt-6">
            <AccentButton onClick={onClose} className="w-full">
              Close
            </AccentButton>
          </div>
        </div>
      </div>
    );
  }

  useEffect(() => {
    if (!isOpen) {
      // Reset state when modal closes
      setCurrentQuestionIndex(0);
      setSelectedAnswers({});
      setShowConfirmSubmit(false);
    }
  }, [isOpen]);

  const handleSelectOption = (shuffledIndex: number) => {
    const originalOptionIndex =
      currentQuestion.shuffledOptions[shuffledIndex].originalIndex;
    setSelectedAnswers((prev) => ({
      ...prev,
      [currentQuestionIndex]: originalOptionIndex,
    }));
  };

  const handleNext = () => {
    if (currentQuestionIndex < totalQuestions - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1);
    }
  };

  const handleSubmitClick = () => {
    if (!allAnswered) {
      return;
    }
    setShowConfirmSubmit(true);
  };

  const handleConfirmSubmit = async () => {
    const userAnswers: UserAnswer[] = Object.entries(selectedAnswers).map(
      ([questionIndex, originalOptionIndex]) => ({
        questionIndex: parseInt(questionIndex),
        selectedOptionIndex: originalOptionIndex,
        isCorrect: false, // Will be set by backend
      })
    );

    await onSubmit(userAnswers);
    setShowConfirmSubmit(false);
  };

  if (!isOpen) {
    return null;
  }

  if (showConfirmSubmit) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        <div className="w-full max-w-md rounded-2xl bg-surface p-6 shadow-2xl">
          <div className="mb-4 flex items-center gap-3">
            <div className="rounded-full bg-accent-soft p-3">
              <FiAlertCircle className="h-6 w-6 text-accent" />
            </div>
            <h3 className="text-xl font-semibold text-text-primary">
              Submit Assessment?
            </h3>
          </div>

          <p className="mb-6 text-text-secondary">
            Are you sure you want to submit your assessment? You have answered
            all {totalQuestions} questions. You need 80% to pass.
          </p>

          <div className="flex gap-3">
            <button
              onClick={() => setShowConfirmSubmit(false)}
              disabled={isSubmitting}
              className="flex-1 rounded-lg border border-border bg-background px-4 py-2.5 font-medium text-text-primary transition-colors hover:bg-surface disabled:opacity-50"
            >
              Review Answers
            </button>
            <AccentButton
              onClick={handleConfirmSubmit}
              disabled={isSubmitting}
              className="flex-1"
            >
              {isSubmitting ? "Submitting..." : "Submit Assessment"}
            </AccentButton>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="relative w-full max-w-3xl max-h-[90vh] overflow-hidden rounded-2xl bg-surface shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border bg-background p-6">
          <div>
            <h2 className="text-2xl font-bold text-text-primary">
              {moduleTitle} Assessment
            </h2>
            <p className="mt-1 text-sm text-text-secondary">
              Question {currentQuestionIndex + 1} of {totalQuestions}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-text-secondary transition-colors hover:bg-surface hover:text-text-primary"
          >
            <FiX className="h-6 w-6" />
          </button>
        </div>

        {/* Progress bar */}
        <div className="h-1 bg-background-subtle">
          <div
            className="h-full bg-accent transition-all duration-300"
            style={{
              width: `${((currentQuestionIndex + 1) / totalQuestions) * 100}%`,
            }}
          />
        </div>

        {/* Question Content */}
        <div
          className="overflow-y-auto p-6"
          style={{ maxHeight: "calc(90vh - 200px)" }}
        >
          {/* Question Prompt */}
          <div className="mb-6">
            <h3 className="mb-3 text-lg font-semibold text-text-primary">
              Question {currentQuestionIndex + 1}
            </h3>
            <div className="prose prose-invert max-w-none">
              <ReactMarkdown>{currentQuestion.prompt.markdown}</ReactMarkdown>
            </div>
          </div>

          {/* Options */}
          <div className="space-y-3">
            {currentQuestion.shuffledOptions.map((option, shuffledIndex) => {
              const isSelected =
                selectedAnswers[currentQuestionIndex] === option.originalIndex;

              return (
                <button
                  key={shuffledIndex}
                  onClick={() => handleSelectOption(shuffledIndex)}
                  className={cn(
                    "w-full rounded-lg border-2 p-4 text-left transition-all",
                    isSelected
                      ? "border-accent bg-accent-soft text-text-primary"
                      : "border-border bg-background text-text-secondary hover:border-accent/50 hover:bg-surface"
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={cn(
                        "mt-0.5 h-5 w-5 rounded-full border-2 flex items-center justify-center",
                        isSelected ? "border-accent bg-accent" : "border-border"
                      )}
                    >
                      {isSelected && (
                        <div className="h-2 w-2 rounded-full bg-white" />
                      )}
                    </div>
                    <span className="flex-1">{option.text}</span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Answer Status Grid */}
          <div className="mt-8 rounded-lg border border-border bg-background p-4">
            <h4 className="mb-3 text-sm font-medium text-text-secondary">
              Answer Status
            </h4>
            <div className="grid grid-cols-10 gap-2">
              {shuffledQuestions.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentQuestionIndex(index)}
                  className={cn(
                    "aspect-square rounded text-xs font-medium transition-all",
                    index === currentQuestionIndex
                      ? "bg-accent text-white"
                      : selectedAnswers[index] !== undefined
                      ? "bg-accent-soft text-accent"
                      : "bg-surface text-text-secondary hover:bg-background-subtle"
                  )}
                >
                  {index + 1}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-border bg-background p-6">
          <button
            onClick={handlePrevious}
            disabled={currentQuestionIndex === 0}
            className="rounded-lg px-4 py-2 font-medium text-text-secondary transition-colors hover:bg-surface hover:text-text-primary disabled:opacity-50 disabled:hover:bg-transparent"
          >
            Previous
          </button>

          <div className="flex items-center gap-2 text-sm text-text-secondary">
            <span>
              {Object.keys(selectedAnswers).length} / {totalQuestions} answered
            </span>
          </div>

          {currentQuestionIndex === totalQuestions - 1 ? (
            <AccentButton
              onClick={handleSubmitClick}
              disabled={!allAnswered || isSubmitting}
            >
              Submit Assessment
            </AccentButton>
          ) : (
            <button
              onClick={handleNext}
              className="rounded-lg bg-accent px-4 py-2 font-medium text-white transition-colors hover:bg-accent-hover disabled:opacity-50"
            >
              Next
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default AssessmentModal;

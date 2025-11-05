import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import {
  FiClock,
  FiAlertCircle,
  FiCheckCircle,
  FiXCircle,
  FiChevronDown,
  FiChevronUp,
  FiTarget,
  FiTrendingUp,
  FiList,
  FiArrowLeft,
} from "react-icons/fi";
import ReactMarkdown from "react-markdown";
import AccentButton from "../../components/common/AccentButton";
import { submitAssessment } from "../../services/repositories/universityRepository";
import type { CourseModule, AssessmentAttempt } from "../../types";
import { cn } from "../../utils/cn";
import toast from "react-hot-toast";

const ASSESSMENT_TIME_LIMIT = parseInt(
  import.meta.env.VITE_ASSESSMENT_TIME_LIMIT || "600"
);

const AssessmentPage = () => {
  const { slug, moduleId } = useParams<{ slug: string; moduleId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { module, courseTitle } = (location.state || {}) as {
    module?: CourseModule;
    courseTitle?: string;
  };

  const [timeRemaining, setTimeRemaining] = useState(ASSESSMENT_TIME_LIMIT);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [showConfirmSubmit, setShowConfirmSubmit] = useState(false);
  const [submittedResult, setSubmittedResult] = useState<{
    attempt: AssessmentAttempt;
    passed: boolean;
    score: number;
  } | null>(null);
  const [expandedQuestions, setExpandedQuestions] = useState<Set<number>>(
    new Set()
  );

  // Auto-submit when timer reaches 0
  useEffect(() => {
    if (!hasStarted || timeRemaining <= 0) return;

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [hasStarted, timeRemaining]);

  // Prevent navigation away
  useEffect(() => {
    if (!hasStarted) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasStarted]);

  const handleAutoSubmit = useCallback(() => {
    if (isSubmitting) return;
    toast.error("Time's up! Submitting your assessment...");
    handleSubmit();
  }, [isSubmitting]);

  const handleStartAssessment = () => {
    setHasStarted(true);
    toast.success("Assessment started! Good luck!");
  };

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, "0")}`;
  };

  const getTimeColor = (): string => {
    if (timeRemaining <= 60) return "text-red-500";
    if (timeRemaining <= 180) return "text-yellow-500";
    return "text-green-500";
  };

  const handleAnswerChange = (questionIndex: number, optionIndex: number) => {
    if (!hasStarted) return;
    setAnswers((prev) => ({
      ...prev,
      [questionIndex]: optionIndex,
    }));
  };

  const handleSubmit = async () => {
    if (!slug || !moduleId || !module || isSubmitting) return;

    const answeredCount = Object.keys(answers).length;
    const totalQuestions = module.assessment?.assessmentQuestions?.length || 0;

    if (answeredCount < totalQuestions && !showConfirmSubmit) {
      setShowConfirmSubmit(true);
      return;
    }

    setIsSubmitting(true);

    try {
      const userAnswers = Object.entries(answers).map(
        ([questionIndex, selectedOptionIndex]) => ({
          questionIndex: parseInt(questionIndex),
          selectedOptionIndex,
          isCorrect: false, // Backend will validate this
        })
      );

      const result = await submitAssessment({
        course_slug: slug,
        module_id: moduleId,
        answers: userAnswers,
      });

      // Store result and show inline
      setSubmittedResult(result);
      setShowConfirmSubmit(false);

      toast.success(
        result.passed
          ? "🎉 Congratulations! You passed!"
          : "Assessment submitted. Review your results below."
      );
    } catch (error) {
      console.error("Failed to submit assessment:", error);
      toast.error("Failed to submit assessment. Please try again.");
      setIsSubmitting(false);
    }
  };

  if (!module || !slug || !moduleId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4">
        <div className="text-center">
          <FiAlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Assessment Not Found
          </h1>
          <p className="text-gray-600 mb-6">
            Unable to load the assessment. Please try again.
          </p>
          <AccentButton onClick={() => navigate(-1)}>Go Back</AccentButton>
        </div>
      </div>
    );
  }

  const questions = module.assessment?.assessmentQuestions || [];
  const answeredCount = Object.keys(answers).length;
  const totalQuestions = questions.length;
  const progress = (answeredCount / totalQuestions) * 100;

  // If assessment is submitted, show results
  if (submittedResult) {
    const { attempt, passed, score } = submittedResult;
    const correctCount = attempt.answers.filter((a) => a.isCorrect).length;

    const toggleQuestion = (index: number) => {
      setExpandedQuestions((prev) => {
        const newSet = new Set(prev);
        if (newSet.has(index)) {
          newSet.delete(index);
        } else {
          newSet.add(index);
        }
        return newSet;
      });
    };

    return (
      <div className="min-h-screen bg-background">
        {/* Compact Results Header */}
        <div className="sticky top-0 z-40 bg-surface border-b border-border shadow-sm">
          <div className="max-w-6xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => navigate(`/university/courses/${slug}`)}
                  className="p-2 hover:bg-background-subtle rounded-lg transition-colors"
                  title="Back to course"
                >
                  <FiArrowLeft className="w-5 h-5 text-foreground" />
                </button>
                <div>
                  <h1 className="text-lg font-bold text-foreground">
                    {module.title}
                  </h1>
                  <p className="text-xs text-muted">{courseTitle}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    "px-3 py-1.5 rounded-full text-xs font-semibold",
                    passed
                      ? "bg-green-500/10 text-green-600 border border-green-500/20"
                      : "bg-red-500/10 text-red-600 border border-red-500/20"
                  )}
                >
                  {passed ? "Passed" : "Not Passed"}
                </div>
              </div>
            </div>

            {/* Compact Score Cards */}
            <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-background-subtle rounded-lg p-3 border border-border">
                <div className="flex items-center gap-2">
                  <FiTarget className="w-4 h-4 text-accent" />
                  <div className="text-xs text-muted">Score</div>
                </div>
                <div className="text-2xl font-bold text-foreground mt-1">
                  {Math.round(score)}%
                </div>
              </div>
              <div className="bg-background-subtle rounded-lg p-3 border border-border">
                <div className="flex items-center gap-2">
                  <FiCheckCircle className="w-4 h-4 text-green-500" />
                  <div className="text-xs text-muted">Correct</div>
                </div>
                <div className="text-2xl font-bold text-foreground mt-1">
                  {correctCount}/{attempt.totalQuestions}
                </div>
              </div>
              <div className="bg-background-subtle rounded-lg p-3 border border-border">
                <div className="flex items-center gap-2">
                  <FiTrendingUp className="w-4 h-4 text-purple-500" />
                  <div className="text-xs text-muted">Attempt</div>
                </div>
                <div className="text-2xl font-bold text-foreground mt-1">
                  #{attempt.attemptNumber}
                </div>
              </div>
              <div className="bg-background-subtle rounded-lg p-3 border border-border">
                <div className="flex items-center gap-2">
                  <FiList className="w-4 h-4 text-blue-500" />
                  <div className="text-xs text-muted">Passing</div>
                </div>
                <div className="text-2xl font-bold text-foreground mt-1">
                  80%
                </div>
              </div>
            </div>

            {!passed && (
              <div className="mt-3 rounded-lg bg-red-500/10 border border-red-500/20 px-3 py-2">
                <p className="text-xs text-red-600">
                  You need 80% or higher to pass. Review below and try again.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Compact Results List */}
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-foreground">
              Answer Review
            </h2>
            <button
              onClick={() => {
                if (expandedQuestions.size === questions.length) {
                  setExpandedQuestions(new Set());
                } else {
                  setExpandedQuestions(new Set(questions.map((_, i) => i)));
                }
              }}
              className="text-xs text-accent hover:underline"
            >
              {expandedQuestions.size === questions.length
                ? "Collapse All"
                : "Expand All"}
            </button>
          </div>

          <div className="space-y-2">
            {questions.map((question, qIndex) => {
              const userAnswer = attempt.answers.find(
                (a) => a.questionIndex === qIndex
              );
              const isCorrect = userAnswer?.isCorrect || false;
              const selectedOptionIndex = userAnswer?.selectedOptionIndex ?? -1;
              const correctOptionIndex = question.options.findIndex(
                (opt) =>
                  opt.isCorrect === true || (opt as any).is_correct === true
              );
              const isExpanded = expandedQuestions.has(qIndex);

              return (
                <div
                  key={qIndex}
                  className={cn(
                    "rounded-lg border bg-surface transition-all",
                    isCorrect ? "border-green-500/30" : "border-red-500/30"
                  )}
                >
                  {/* Question Header - Always Visible */}
                  <button
                    onClick={() => toggleQuestion(qIndex)}
                    className="w-full px-4 py-3 flex items-center gap-3 text-left hover:bg-background-subtle transition-colors"
                  >
                    {isCorrect ? (
                      <FiCheckCircle className="w-5 h-5 flex-shrink-0 text-green-600" />
                    ) : (
                      <FiXCircle className="w-5 h-5 flex-shrink-0 text-red-600" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-foreground line-clamp-1">
                        Question {qIndex + 1}:{" "}
                        {question.prompt.markdown.substring(0, 80)}
                        {question.prompt.markdown.length > 80 ? "..." : ""}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span
                        className={cn(
                          "text-xs font-medium",
                          isCorrect ? "text-green-600" : "text-red-600"
                        )}
                      >
                        {isCorrect ? "Correct" : "Incorrect"}
                      </span>
                      {isExpanded ? (
                        <FiChevronUp className="w-4 h-4 text-muted" />
                      ) : (
                        <FiChevronDown className="w-4 h-4 text-muted" />
                      )}
                    </div>
                  </button>

                  {/* Expandable Details */}
                  {isExpanded && (
                    <div className="px-4 pb-4 border-t border-border">
                      {/* Full Question */}
                      <div className="mt-3 mb-4">
                        <div className="text-xs font-semibold text-muted uppercase tracking-wide mb-2">
                          Question
                        </div>
                        <div className="prose prose-sm max-w-none text-foreground">
                          <ReactMarkdown>
                            {question.prompt.markdown}
                          </ReactMarkdown>
                        </div>
                      </div>

                      {/* Options */}
                      <div className="space-y-2 mb-4">
                        {question.options.map((option, optIndex) => {
                          const isUserSelection =
                            selectedOptionIndex === optIndex;
                          const isCorrectOption =
                            optIndex === correctOptionIndex;

                          return (
                            <div
                              key={optIndex}
                              className={cn(
                                "rounded-md border px-3 py-2 text-sm",
                                isUserSelection && isCorrectOption
                                  ? "border-green-500 bg-green-500/10"
                                  : isCorrectOption
                                  ? "border-green-400 bg-green-400/5"
                                  : isUserSelection
                                  ? "border-red-400 bg-red-400/10"
                                  : "border-border bg-background-subtle"
                              )}
                            >
                              <div className="flex items-start gap-2">
                                {(isUserSelection || isCorrectOption) && (
                                  <div className="flex-shrink-0 mt-0.5">
                                    {isCorrectOption ? (
                                      <FiCheckCircle className="w-4 h-4 text-green-600" />
                                    ) : (
                                      <FiXCircle className="w-4 h-4 text-red-600" />
                                    )}
                                  </div>
                                )}
                                <div className="flex-1">
                                  <span className="text-foreground">
                                    {option.text}
                                  </span>
                                  {isUserSelection && isCorrectOption && (
                                    <span className="ml-2 text-xs text-green-600 font-medium">
                                      (Your answer ✓)
                                    </span>
                                  )}
                                  {isCorrectOption && !isUserSelection && (
                                    <span className="ml-2 text-xs text-green-600 font-medium">
                                      (Correct answer)
                                    </span>
                                  )}
                                  {isUserSelection && !isCorrectOption && (
                                    <span className="ml-2 text-xs text-red-600 font-medium">
                                      (Your answer ✗)
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Explanation */}
                      <div className="rounded-md bg-blue-500/5 border border-blue-500/20 px-3 py-2">
                        <div className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-1">
                          Explanation
                        </div>
                        <div className="prose prose-sm max-w-none text-foreground">
                          <ReactMarkdown>
                            {question.explanation.markdown}
                          </ReactMarkdown>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Footer */}
          <div className="mt-6 flex items-center justify-between border-t border-border pt-4">
            <p className="text-sm text-muted">
              {passed
                ? "Great job! Continue to the next module."
                : "Review the explanations and try again."}
            </p>
            <AccentButton
              onClick={() => navigate(`/university/courses/${slug}`)}
              className="cursor-pointer"
            >
              {passed ? "Continue Learning" : "Back to Course"}
            </AccentButton>
          </div>
        </div>
      </div>
    );
  }

  if (!hasStarted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-xl w-full bg-surface rounded-2xl border border-border shadow-lg p-6">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <FiCheckCircle className="w-8 h-8 text-accent" />
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-2">
              {module.title} Assessment
            </h1>
            <p className="text-sm text-muted">{courseTitle}</p>
          </div>

          <div className="bg-background-subtle rounded-xl p-4 mb-6 space-y-3">
            <div className="flex items-start gap-3">
              <FiClock className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <div className="text-sm font-semibold text-foreground">
                  10 Minutes
                </div>
                <div className="text-xs text-muted">
                  Timer starts immediately and cannot be paused
                </div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <FiList className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <div className="text-sm font-semibold text-foreground">
                  {totalQuestions} Questions
                </div>
                <div className="text-xs text-muted">
                  Answer all questions to maximize your score
                </div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <FiTarget className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <div className="text-sm font-semibold text-foreground">
                  80% to Pass
                </div>
                <div className="text-xs text-muted">
                  You'll see results immediately after submitting
                </div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <FiAlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <div className="text-sm font-semibold text-foreground">
                  No Navigation
                </div>
                <div className="text-xs text-muted">
                  Don't leave this page or you'll lose progress
                </div>
              </div>
            </div>
          </div>

          <AccentButton
            onClick={handleStartAssessment}
            className="w-full py-3 text-base cursor-pointer"
          >
            Start Assessment
          </AccentButton>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      {/* Compact Header */}
      <div className="flex-shrink-0 bg-surface border-b border-border shadow-sm">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1 min-w-0">
              <h1 className="text-base font-bold text-foreground truncate">
                {module.title}
              </h1>
              <p className="text-xs text-muted">
                {answeredCount}/{totalQuestions} answered
              </p>
            </div>
            <div
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-lg border",
                timeRemaining <= 60
                  ? "border-red-200 bg-red-50"
                  : timeRemaining <= 180
                  ? "border-yellow-200 bg-yellow-50"
                  : "border-green-200 bg-green-50"
              )}
            >
              <FiClock className={cn("w-4 h-4", getTimeColor())} />
              <div
                className={cn("text-xl font-mono font-bold", getTimeColor())}
              >
                {formatTime(timeRemaining)}
              </div>
            </div>
          </div>
          {/* Progress Bar */}
          <div className="mt-2">
            <div className="w-full bg-background-subtle rounded-full h-1.5">
              <div
                className="bg-accent h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content - Two Column Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Questions Section - Scrollable */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-4 space-y-3">
            {questions.map((question, questionIndex) => {
              const isAnswered = answers[questionIndex] !== undefined;
              return (
                <div
                  key={questionIndex}
                  className={cn(
                    "bg-surface rounded-lg border p-4 transition-all",
                    isAnswered
                      ? "border-accent shadow-sm"
                      : "border-border hover:border-accent/50"
                  )}
                >
                  {/* Question */}
                  <div className="flex items-start gap-3 mb-3">
                    <div
                      className={cn(
                        "flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold",
                        isAnswered
                          ? "bg-accent text-white"
                          : "bg-background-subtle text-muted"
                      )}
                    >
                      {questionIndex + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-foreground leading-relaxed">
                        <ReactMarkdown className="prose prose-sm max-w-none">
                          {question.prompt?.markdown || "No question text"}
                        </ReactMarkdown>
                      </div>
                    </div>
                  </div>

                  {/* Options */}
                  <div className="space-y-2 ml-10">
                    {question.options?.map((option, optionIndex) => {
                      const isSelected = answers[questionIndex] === optionIndex;
                      return (
                        <button
                          key={optionIndex}
                          onClick={() =>
                            handleAnswerChange(questionIndex, optionIndex)
                          }
                          className={cn(
                            "w-full text-left px-3 py-2 rounded-md border text-sm transition-all",
                            isSelected
                              ? "border-accent bg-accent/10 font-medium"
                              : "border-border bg-background-subtle hover:border-accent/50 hover:bg-accent/5"
                          )}
                        >
                          <div className="flex items-center gap-2">
                            <div
                              className={cn(
                                "flex-shrink-0 w-4 h-4 rounded-full border-2 flex items-center justify-center",
                                isSelected
                                  ? "border-accent bg-accent"
                                  : "border-muted"
                              )}
                            >
                              {isSelected && (
                                <div className="w-1.5 h-1.5 rounded-full bg-white" />
                              )}
                            </div>
                            <span className="text-foreground">
                              {option.text}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Sidebar - Question Navigator (Desktop Only) */}
        <div className="hidden lg:flex flex-col w-64 border-l border-border bg-surface">
          <div className="p-4 border-b border-border">
            <h3 className="text-sm font-semibold text-foreground mb-2">
              Question Navigator
            </h3>
            <div className="text-xs text-muted">
              Click to jump to a question
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            <div className="grid grid-cols-5 gap-2">
              {questions.map((_, idx) => {
                const isAnswered = answers[idx] !== undefined;
                return (
                  <button
                    key={idx}
                    onClick={() => {
                      document
                        .getElementById(`question-${idx}`)
                        ?.scrollIntoView({
                          behavior: "smooth",
                          block: "center",
                        });
                    }}
                    className={cn(
                      "aspect-square rounded-md text-xs font-semibold transition-all",
                      isAnswered
                        ? "bg-accent text-white shadow-sm"
                        : "bg-background-subtle text-muted hover:bg-accent/10 hover:text-accent border border-border"
                    )}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Submit Button in Sidebar */}
          <div className="p-4 border-t border-border">
            <AccentButton
              onClick={handleSubmit}
              disabled={isSubmitting || answeredCount === 0}
              className="w-full py-2.5 text-sm cursor-pointer"
            >
              {isSubmitting ? "Submitting..." : "Submit Assessment"}
            </AccentButton>
            {answeredCount < totalQuestions && (
              <p className="text-xs text-amber-600 mt-2 text-center">
                {totalQuestions - answeredCount} unanswered
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Submit Button */}
      <div className="lg:hidden flex-shrink-0 bg-surface border-t border-border p-4">
        <AccentButton
          onClick={handleSubmit}
          disabled={isSubmitting || answeredCount === 0}
          className="w-full py-3"
        >
          {isSubmitting ? "Submitting..." : "Submit Assessment"}
        </AccentButton>
        {answeredCount < totalQuestions && (
          <p className="text-xs text-amber-600 mt-2 text-center">
            {totalQuestions - answeredCount} question
            {totalQuestions - answeredCount !== 1 ? "s" : ""} unanswered
          </p>
        )}
      </div>

      {/* Confirmation Modal */}
      {showConfirmSubmit && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-surface rounded-xl shadow-2xl max-w-sm w-full p-6 border border-border">
            <div className="text-center">
              <div className="w-12 h-12 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto mb-3">
                <FiAlertCircle className="w-6 h-6 text-amber-600" />
              </div>
              <h2 className="text-lg font-bold text-foreground mb-2">
                Submit Incomplete?
              </h2>
              <p className="text-sm text-muted mb-4">
                {answeredCount}/{totalQuestions} answered. Unanswered questions
                will be marked incorrect.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowConfirmSubmit(false)}
                  className="flex-1 px-4 py-2 bg-background-subtle text-foreground rounded-lg text-sm font-medium hover:bg-background transition-colors"
                >
                  Go Back
                </button>
                <AccentButton
                  onClick={handleSubmit}
                  className="flex-1 px-4 py-2"
                >
                  Submit
                </AccentButton>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AssessmentPage;

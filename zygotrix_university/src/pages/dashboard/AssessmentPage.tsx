import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import {
  FiClock,
  FiAlertCircle,
  FiCheckCircle,
  FiCircle,
  FiXCircle,
  FiAward,
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

    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
        {/* Results Header */}
        <div className="bg-white border-b border-gray-200 shadow-sm">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-4">
                {passed ? (
                  <FiAward className="h-12 w-12 text-green-500" />
                ) : (
                  <FiXCircle className="h-12 w-12 text-red-500" />
                )}
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                    {passed ? "Assessment Passed!" : "Assessment Not Passed"}
                  </h1>
                  <p className="text-gray-600 mt-1">{module.title}</p>
                </div>
              </div>
            </div>

            {/* Score Summary */}
            <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-indigo-50 rounded-lg p-4">
                <div className="text-3xl font-bold text-indigo-600">
                  {Math.round(score)}%
                </div>
                <div className="text-sm text-gray-600">Your Score</div>
              </div>
              <div className="bg-green-50 rounded-lg p-4">
                <div className="text-3xl font-bold text-green-600">
                  {correctCount}/{attempt.totalQuestions}
                </div>
                <div className="text-sm text-gray-600">Correct Answers</div>
              </div>
              <div className="bg-purple-50 rounded-lg p-4">
                <div className="text-3xl font-bold text-purple-600">
                  {attempt.attemptNumber}
                </div>
                <div className="text-sm text-gray-600">Attempt Number</div>
              </div>
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="text-3xl font-bold text-blue-600">
                  {passed ? "80%" : "< 80%"}
                </div>
                <div className="text-sm text-gray-600">Passing Score</div>
              </div>
            </div>

            {!passed && (
              <div className="mt-4 rounded-lg bg-red-50 border border-red-200 p-4">
                <p className="text-sm text-red-700">
                  You need 80% or higher to pass. Review the explanations below
                  and try again.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Detailed Results */}
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Detailed Results
          </h2>

          <div className="space-y-6">
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

              return (
                <div
                  key={qIndex}
                  className={cn(
                    "rounded-xl border-2 p-6 bg-white",
                    isCorrect
                      ? "border-green-200 bg-green-50/30"
                      : "border-red-200 bg-red-50/30"
                  )}
                >
                  {/* Question Header */}
                  <div className="flex items-start gap-4 mb-4">
                    {isCorrect ? (
                      <FiCheckCircle className="mt-1 h-6 w-6 flex-shrink-0 text-green-600" />
                    ) : (
                      <FiXCircle className="mt-1 h-6 w-6 flex-shrink-0 text-red-600" />
                    )}
                    <div className="flex-1">
                      <div className="text-sm font-semibold text-gray-600 mb-2">
                        Question {qIndex + 1}
                      </div>
                      <div className="prose prose-lg max-w-none text-gray-900">
                        <ReactMarkdown>
                          {question.prompt.markdown}
                        </ReactMarkdown>
                      </div>
                    </div>
                  </div>

                  {/* Options */}
                  <div className="ml-10 space-y-3">
                    {question.options.map((option, optIndex) => {
                      const isUserSelection = selectedOptionIndex === optIndex;
                      const isCorrectOption = optIndex === correctOptionIndex;
                      const isUserCorrect = isUserSelection && isCorrectOption;

                      return (
                        <div
                          key={optIndex}
                          className={cn(
                            "rounded-lg border-2 p-4",
                            isUserCorrect
                              ? "border-green-500 bg-green-100"
                              : isCorrectOption
                              ? "border-green-400 bg-green-50"
                              : isUserSelection
                              ? "border-red-400 bg-red-50"
                              : "border-gray-200 bg-white"
                          )}
                        >
                          <div className="flex items-start gap-3">
                            {isUserCorrect && (
                              <FiCheckCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-600" />
                            )}
                            {!isUserCorrect && isCorrectOption && (
                              <FiCheckCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-600" />
                            )}
                            {isUserSelection && !isCorrectOption && (
                              <FiXCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-600" />
                            )}
                            <div className="flex-1">
                              <span
                                className={cn(
                                  "text-base",
                                  isUserCorrect
                                    ? "font-semibold text-green-800"
                                    : isCorrectOption
                                    ? "font-semibold text-green-700"
                                    : isUserSelection
                                    ? "font-medium text-red-700"
                                    : "text-gray-700"
                                )}
                              >
                                {option.text}
                              </span>
                              {isUserCorrect && (
                                <span className="ml-2 text-xs text-green-600 font-medium">
                                  (Your Answer - Correct!)
                                </span>
                              )}
                              {!isUserCorrect && isCorrectOption && (
                                <span className="ml-2 text-xs text-green-600 font-medium">
                                  (Correct Answer)
                                </span>
                              )}
                              {isUserSelection && !isCorrectOption && (
                                <span className="ml-2 text-xs text-red-600 font-medium">
                                  (Your Answer - Incorrect)
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Explanation */}
                  <div className="ml-10 mt-4 rounded-lg bg-indigo-50 border border-indigo-200 p-4">
                    <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-indigo-700">
                      Explanation
                    </div>
                    <div className="prose prose-sm max-w-none text-gray-800">
                      <ReactMarkdown>
                        {question.explanation.markdown}
                      </ReactMarkdown>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer Actions */}
          <div className="mt-8 flex items-center justify-between border-t border-gray-200 pt-6">
            <div className="text-sm text-gray-600">
              {passed
                ? "Congratulations! You can now proceed to the next module."
                : "Review the material and try again to pass the assessment."}
            </div>
            <AccentButton
              onClick={() => navigate(`/university/courses/${slug}`)}
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
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4">
        <div className="max-w-2xl w-full bg-white rounded-2xl shadow-xl p-8 md:p-12">
          <div className="text-center">
            <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <FiCheckCircle className="w-10 h-10 text-indigo-600" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Ready to Start?
            </h1>
            <p className="text-lg text-gray-600 mb-2">{courseTitle}</p>
            <p className="text-xl font-semibold text-gray-800 mb-8">
              {module.title}
            </p>

            <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-6 mb-8 text-left">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <FiAlertCircle className="text-indigo-600" />
                Assessment Instructions
              </h2>
              <ul className="space-y-3 text-gray-700">
                <li className="flex items-start gap-3">
                  <FiClock className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
                  <span>
                    <strong>Time Limit:</strong> You have{" "}
                    <strong>10 minutes</strong> to complete this assessment.
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <FiAlertCircle className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
                  <span>
                    <strong>Auto-Submit:</strong> The timer starts automatically
                    and cannot be paused. The assessment will auto-submit when
                    time runs out.
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <FiCheckCircle className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
                  <span>
                    <strong>Questions:</strong> There are{" "}
                    <strong>{totalQuestions}</strong> questions. Answer all to
                    maximize your score.
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <FiXCircle className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
                  <span>
                    <strong>No Going Back:</strong> Once you start, you cannot
                    leave this page without losing your progress.
                  </span>
                </li>
              </ul>
            </div>

            <AccentButton
              onClick={handleStartAssessment}
              className="w-full md:w-auto px-12 py-4 text-lg"
            >
              Start Assessment
            </AccentButton>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Fixed Header with Timer */}
      <div className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex-1 min-w-0">
              <h1 className="text-lg md:text-xl font-bold text-gray-900 truncate">
                {module.title}
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                {answeredCount} of {totalQuestions} answered
              </p>
            </div>
            <div
              className={cn(
                "flex items-center gap-3 px-4 py-2 bg-gray-50 rounded-lg border-2",
                timeRemaining <= 60
                  ? "border-red-200 bg-red-50"
                  : timeRemaining <= 180
                  ? "border-yellow-200 bg-yellow-50"
                  : "border-green-200 bg-green-50"
              )}
            >
              <FiClock className={cn("w-5 h-5", getTimeColor())} />
              <div className="text-right">
                <div
                  className={cn("text-2xl font-mono font-bold", getTimeColor())}
                >
                  {formatTime(timeRemaining)}
                </div>
                <div className="text-xs text-gray-600">remaining</div>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">
                Progress
              </span>
              <span className="text-sm font-medium text-indigo-600">
                {Math.round(progress)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
                role="progressbar"
                aria-valuenow={progress}
                aria-valuemin={0}
                aria-valuemax={100}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Questions */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="space-y-8">
            {questions.map((question, questionIndex) => {
              const isAnswered = answers[questionIndex] !== undefined;
              return (
                <div
                  key={questionIndex}
                  className={cn(
                    "bg-white rounded-xl shadow-lg p-6 md:p-8 border-2 transition-all",
                    isAnswered
                      ? "border-indigo-200 bg-indigo-50/30"
                      : "border-gray-200"
                  )}
                >
                  {/* Question Number and Text */}
                  <div className="flex items-start gap-4 mb-6">
                    <div
                      className={cn(
                        "flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold",
                        isAnswered
                          ? "bg-indigo-600 text-white"
                          : "bg-gray-200 text-gray-600"
                      )}
                    >
                      {questionIndex + 1}
                    </div>
                    <div className="flex-1">
                      <div className="prose prose-lg max-w-none text-gray-900">
                        {question.prompt?.markdown || "No question text"}
                      </div>
                    </div>
                  </div>

                  {/* Options */}
                  <div className="space-y-3 ml-14">
                    {question.options?.map((option, optionIndex) => {
                      const isSelected = answers[questionIndex] === optionIndex;
                      return (
                        <button
                          key={optionIndex}
                          onClick={() =>
                            handleAnswerChange(questionIndex, optionIndex)
                          }
                          className={cn(
                            "w-full text-left p-4 rounded-lg border-2 transition-all group hover:shadow-md",
                            isSelected
                              ? "border-indigo-600 bg-indigo-50 shadow-md"
                              : "border-gray-300 bg-white hover:border-indigo-300 hover:bg-indigo-50/50"
                          )}
                          aria-pressed={isSelected}
                          aria-label={`Option ${optionIndex + 1}: ${
                            option.text
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={cn(
                                "flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all",
                                isSelected
                                  ? "border-indigo-600 bg-indigo-600"
                                  : "border-gray-400 bg-white group-hover:border-indigo-400"
                              )}
                            >
                              {isSelected ? (
                                <FiCheckCircle className="w-4 h-4 text-white" />
                              ) : (
                                <FiCircle className="w-3 h-3 text-gray-400 group-hover:text-indigo-400" />
                              )}
                            </div>
                            <span
                              className={cn(
                                "text-base",
                                isSelected
                                  ? "text-indigo-900 font-medium"
                                  : "text-gray-700"
                              )}
                            >
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

        {/* Submit Section - Fixed at Bottom */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 shadow-lg">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Ready to Submit?
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  {answeredCount === totalQuestions ? (
                    <span className="text-green-600 font-medium">
                      All questions answered!
                    </span>
                  ) : (
                    <span className="text-yellow-600">
                      {totalQuestions - answeredCount} question
                      {totalQuestions - answeredCount !== 1 ? "s" : ""}{" "}
                      remaining
                    </span>
                  )}
                </p>
              </div>
              <AccentButton
                onClick={handleSubmit}
                disabled={isSubmitting || answeredCount === 0}
                className="px-8 py-3"
              >
                {isSubmitting ? "Submitting..." : "Submit Assessment"}
              </AccentButton>
            </div>
          </div>
        </div>

        {/* Confirmation Modal */}
        {showConfirmSubmit && (
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirm-submit-title"
          >
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FiAlertCircle className="w-8 h-8 text-yellow-600" />
                </div>
                <h2
                  id="confirm-submit-title"
                  className="text-2xl font-bold text-gray-900 mb-2"
                >
                  Submit Incomplete Assessment?
                </h2>
                <p className="text-gray-600 mb-6">
                  You have answered {answeredCount} out of {totalQuestions}{" "}
                  questions. Unanswered questions will be marked as incorrect.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowConfirmSubmit(false)}
                    className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                  >
                    Go Back
                  </button>
                  <AccentButton
                    onClick={handleSubmit}
                    className="flex-1 px-4 py-3"
                  >
                    Submit Anyway
                  </AccentButton>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AssessmentPage;

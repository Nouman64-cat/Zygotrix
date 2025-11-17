import { useState, useEffect } from "react";
import {
  FiX,
  FiCheckCircle,
  FiXCircle,
  FiAward,
  FiLoader,
} from "react-icons/fi";
import AccentButton from "../common/AccentButton";
import MarkdownContent from "../common/MarkdownContent";
import type { AssessmentResult } from "../../types";
import { cn } from "../../utils/cn";
import { getAnswerExplanation } from "../../services/claudeService";

interface AssessmentResultsModalProps {
  isOpen: boolean;
  onClose: () => void;
  result: AssessmentResult;
  moduleTitle: string;
}

const AssessmentResultsModal = ({
  isOpen,
  onClose,
  result,
  moduleTitle,
}: AssessmentResultsModalProps) => {
  const [aiExplanations, setAiExplanations] = useState<Record<number, string>>(
    {}
  );
  const [loadingExplanations, setLoadingExplanations] = useState<
    Record<number, boolean>
  >({});

  // Fetch AI explanations for correct answers when modal opens
  useEffect(() => {
    if (!isOpen) return;

    const fetchExplanations = async () => {
      const attempt = result?.attempt;
      const questions = result?.questions || [];

      // Only fetch for questions user got wrong
      const incorrectQuestions = questions
        .map((question, qIndex) => {
          const userAnswer = attempt?.answers.find(
            (a) => a.questionIndex === qIndex
          );
          const isCorrect = userAnswer?.isCorrect || false;
          return { question, qIndex, isCorrect };
        })
        .filter((q) => !q.isCorrect);

      // Fetch explanations sequentially to avoid rate limits
      for (const { question, qIndex } of incorrectQuestions) {
        if (aiExplanations[qIndex]) continue; // Skip if already fetched

        setLoadingExplanations((prev) => ({ ...prev, [qIndex]: true }));

        const correctOption = question.options.find(
          (opt) => opt.isCorrect === true || (opt as any).is_correct === true
        );

        if (correctOption) {
          const explanation = await getAnswerExplanation(
            question.prompt.markdown,
            correctOption.text,
            question.explanation.markdown
          );

          setAiExplanations((prev) => ({ ...prev, [qIndex]: explanation }));
        }

        setLoadingExplanations((prev) => ({ ...prev, [qIndex]: false }));
      }
    };

    fetchExplanations();
  }, [isOpen, result]);

  if (!isOpen) {
    return null;
  }

  const { attempt } = result;
  const questions = result?.questions || [];
  const passed = attempt.passed;
  const score = Math.round(attempt.score);
  const correctCount = attempt.answers.filter((a) => a.isCorrect).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="relative w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden rounded-2xl bg-surface shadow-2xl">
        {/* Header */}
        <div
          className={cn(
            "border-b border-border p-6 flex-shrink-0",
            passed ? "bg-green-500/10" : "bg-red-500/10"
          )}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3">
                {passed ? (
                  <FiAward className="h-8 w-8 text-green-500" />
                ) : (
                  <FiXCircle className="h-8 w-8 text-red-500" />
                )}
                <div>
                  <h2 className="text-2xl font-bold text-text-primary">
                    {passed ? "Assessment Passed!" : "Assessment Not Passed"}
                  </h2>
                  <p className="mt-1 text-sm text-text-secondary">
                    {moduleTitle} Assessment Results
                  </p>
                </div>
              </div>

              {/* Score Summary */}
              <div className="mt-4 flex gap-6">
                <div>
                  <div className="text-3xl font-bold text-text-primary">
                    {score}%
                  </div>
                  <div className="text-sm text-text-secondary">Your Score</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-text-primary">
                    {correctCount}/{attempt.totalQuestions}
                  </div>
                  <div className="text-sm text-text-secondary">
                    Correct Answers
                  </div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-text-primary">
                    {attempt.attemptNumber}
                  </div>
                  <div className="text-sm text-text-secondary">
                    Attempt Number
                  </div>
                </div>
              </div>

              {!passed && (
                <div className="mt-4 rounded-lg bg-red-500/10 border border-red-500/20 p-3">
                  <p className="text-sm text-red-400">
                    You need 80% or higher to pass. Review the explanations
                    below and try again.
                  </p>
                </div>
              )}
            </div>

            <button
              onClick={onClose}
              className="rounded-lg p-2 text-text-secondary transition-colors hover:bg-surface hover:text-text-primary"
            >
              <FiX className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Results Content */}
        <div className="overflow-y-auto p-6 flex-1">
          <h3 className="mb-4 text-lg font-semibold text-text-primary">
            Detailed Results
          </h3>

          <div className="space-y-6">
            {questions.map((question, qIndex) => {
              const userAnswer = attempt.answers.find(
                (a) => a.questionIndex === qIndex
              );
              const isCorrect = userAnswer?.isCorrect || false;
              const selectedOptionIndex = userAnswer?.selectedOptionIndex ?? -1;

              // Check both camelCase and snake_case for correct option
              const correctOptionIndex = question.options.findIndex(
                (opt) =>
                  opt.isCorrect === true || (opt as any).is_correct === true
              );

              return (
                <div
                  key={qIndex}
                  className={cn(
                    "rounded-lg border-2 p-4",
                    isCorrect
                      ? "border-green-500/30 bg-green-500/5"
                      : "border-red-500/30 bg-red-500/5"
                  )}
                >
                  {/* Question Header */}
                  <div className="mb-3 flex items-start gap-3">
                    {isCorrect ? (
                      <FiCheckCircle className="mt-1 h-5 w-5 flex-shrink-0 text-green-500" />
                    ) : (
                      <FiXCircle className="mt-1 h-5 w-5 flex-shrink-0 text-red-500" />
                    )}
                    <div className="flex-1">
                      <div className="mb-2 text-sm font-medium text-text-secondary">
                        Question {qIndex + 1}
                      </div>
                      <MarkdownContent>
                        {question.prompt.markdown}
                      </MarkdownContent>
                    </div>
                  </div>

                  {/* Options */}
                  <div className="ml-8 space-y-2">
                    {question.options.map((option, optIndex) => {
                      const isUserSelection = selectedOptionIndex === optIndex;
                      const isCorrectOption = optIndex === correctOptionIndex;
                      const isUserCorrect = isUserSelection && isCorrectOption;

                      return (
                        <div
                          key={optIndex}
                          className={cn(
                            "rounded-lg border p-3 text-sm",
                            isUserCorrect
                              ? "border-green-500/70 bg-green-500/20"
                              : isCorrectOption
                              ? "border-green-500/50 bg-green-500/10"
                              : isUserSelection
                              ? "border-red-500/50 bg-red-500/10"
                              : "border-border bg-background"
                          )}
                        >
                          <div className="flex items-start gap-2">
                            {isUserCorrect && (
                              <FiCheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-500" />
                            )}
                            {!isUserCorrect && isCorrectOption && (
                              <FiCheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-500" />
                            )}
                            {isUserSelection && !isCorrectOption && (
                              <FiXCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-500" />
                            )}
                            <div className="flex-1">
                              <span
                                className={cn(
                                  isUserCorrect
                                    ? "font-medium text-green-400"
                                    : isCorrectOption
                                    ? "font-medium text-green-400"
                                    : isUserSelection
                                    ? "font-medium text-red-400"
                                    : "text-text-secondary"
                                )}
                              >
                                {option.text}
                              </span>
                              {isUserCorrect && (
                                <>
                                  <span className="ml-2 text-xs text-green-500">
                                    (Correct Answer)
                                  </span>
                                  <span className="ml-2 text-xs text-green-500">
                                    (Your Answer)
                                  </span>
                                </>
                              )}
                              {!isUserCorrect && isCorrectOption && (
                                <span className="ml-2 text-xs text-green-500">
                                  (Correct Answer)
                                </span>
                              )}
                              {isUserSelection && !isCorrectOption && (
                                <span className="ml-2 text-xs text-red-500">
                                  (Your Answer)
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Explanation */}
                  <div className="ml-8 mt-4 rounded-lg bg-background p-4">
                    <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-accent">
                      Explanation
                    </div>

                    {/* Original Explanation */}
                    <MarkdownContent>
                      {question.explanation.markdown}
                    </MarkdownContent>

                    {/* AI-Enhanced Explanation for incorrect answers */}
                    {!isCorrect && (
                      <div className="mt-4 border-t border-border pt-4">
                        <div className="mb-2 flex items-center gap-2">
                          <div className="text-xs font-semibold uppercase tracking-wide text-indigo-400">
                            AI Insight
                          </div>
                          {loadingExplanations[qIndex] && (
                            <FiLoader className="h-3 w-3 animate-spin text-indigo-400" />
                          )}
                        </div>
                        <div className="text-text-secondary">
                          {loadingExplanations[qIndex] ? (
                            <p className="text-sm italic">
                              Generating AI explanation...
                            </p>
                          ) : aiExplanations[qIndex] ? (
                            <MarkdownContent>
                              {aiExplanations[qIndex]}
                            </MarkdownContent>
                          ) : (
                            <p className="text-sm italic">
                              Review the explanation above.
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-border bg-background p-6 flex-shrink-0">
          <div className="text-sm text-text-secondary">
            {passed
              ? "Congratulations! You can now proceed to the next module."
              : "Review the material and try again to pass the assessment."}
          </div>
          <AccentButton onClick={onClose}>
            {passed ? "Continue Learning" : "Try Again"}
          </AccentButton>
        </div>
      </div>
    </div>
  );
};

export default AssessmentResultsModal;

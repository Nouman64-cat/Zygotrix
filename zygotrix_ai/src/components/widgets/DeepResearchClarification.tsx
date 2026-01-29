/**
 * DeepResearchClarification Widget
 *
 * An interactive widget that displays clarification questions and collects
 * user answers before starting the deep research process.
 */

import React, { useState, useCallback } from "react";
import { FiSearch, FiCheck } from "react-icons/fi";
import { cn } from "../../utils";

export interface ClarificationQuestion {
    id: string;
    question: string;
    context?: string;
    suggested_answers: string[];
}

export interface DeepResearchClarificationProps {
    sessionId: string;
    questions: ClarificationQuestion[];
    onSubmit: (answers: Array<{ question_id: string; answer: string }>) => void;
    isLoading?: boolean;
}

export const DeepResearchClarification: React.FC<
    DeepResearchClarificationProps
> = ({ sessionId: _sessionId, questions, onSubmit, isLoading = false }) => {
    const [answers, setAnswers] = useState<Record<string, string>>({});
    const [customInputs, setCustomInputs] = useState<Record<string, boolean>>({});

    // Check if all questions have been answered
    const allAnswered = questions.every(
        (q) => answers[q.id] && answers[q.id].trim().length > 0
    );

    // Handle selecting a suggested answer
    const handleSelectAnswer = useCallback((questionId: string, answer: string) => {
        setAnswers((prev) => ({
            ...prev,
            [questionId]: answer,
        }));
        setCustomInputs((prev) => ({
            ...prev,
            [questionId]: false,
        }));
    }, []);

    // Handle custom answer input
    const handleCustomAnswer = useCallback(
        (questionId: string, value: string) => {
            setAnswers((prev) => ({
                ...prev,
                [questionId]: value,
            }));
        },
        []
    );

    // Toggle custom input mode
    const handleToggleCustom = useCallback((questionId: string) => {
        setCustomInputs((prev) => ({
            ...prev,
            [questionId]: !prev[questionId],
        }));
        // Clear the answer when switching to custom
        setAnswers((prev) => ({
            ...prev,
            [questionId]: "",
        }));
    }, []);

    // Submit answers
    const handleSubmit = useCallback(() => {
        if (!allAnswered || isLoading) return;

        const formattedAnswers = questions.map((q) => ({
            question_id: q.id,
            answer: answers[q.id],
        }));

        onSubmit(formattedAnswers);
    }, [allAnswered, isLoading, questions, answers, onSubmit]);

    return (
        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden mt-3 shadow-sm">
            {/* Header */}
            <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-gray-200 dark:bg-gray-700 flex items-center justify-center shrink-0">
                    <FiSearch className="text-gray-500 dark:text-gray-400 text-sm" />
                </div>
                <div>
                    <h3 className="text-gray-900 dark:text-white font-medium text-sm leading-tight">
                        Deep Research - Clarification
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400 text-xs">
                        Refine your research by answering these questions
                    </p>
                </div>
            </div>

            {/* Questions */}
            <div className="p-4 space-y-4">
                {questions.map((question, index) => (
                    <div key={question.id} className="space-y-2">
                        {/* Question */}
                        <div className="flex items-start gap-2.5">
                            <div
                                className={cn(
                                    "w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5",
                                    answers[question.id]
                                        ? "bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900"
                                        : "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700"
                                )}
                            >
                                {answers[question.id] ? <FiCheck /> : index + 1}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-gray-800 dark:text-gray-200 text-sm font-medium leading-normal">
                                    {question.question}
                                </p>
                                {question.context && (
                                    <p className="text-gray-500 dark:text-gray-400 text-xs mt-0.5">
                                        {question.context}
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Answer Options */}
                        <div className="ml-7.5 pl-0.5 space-y-2">
                            {/* Suggested Answers */}
                            {question.suggested_answers.length > 0 &&
                                !customInputs[question.id] && (
                                    <div className="flex flex-wrap gap-2">
                                        {question.suggested_answers.map((suggestion, idx) => (
                                            <button
                                                key={idx}
                                                onClick={() =>
                                                    handleSelectAnswer(question.id, suggestion)
                                                }
                                                className={cn(
                                                    "px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200 border text-left",
                                                    answers[question.id] === suggestion
                                                        ? "bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 border-gray-900 dark:border-gray-100 shadow-sm"
                                                        : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-500"
                                                )}
                                            >
                                                {suggestion}
                                            </button>
                                        ))}
                                        <button
                                            onClick={() => handleToggleCustom(question.id)}
                                            className="px-3 py-1.5 rounded-md text-xs font-medium text-gray-500 dark:text-gray-400 border border-dashed border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                                        >
                                            Custom...
                                        </button>
                                    </div>
                                )}

                            {/* Custom Input */}
                            {(customInputs[question.id] ||
                                question.suggested_answers.length === 0) && (
                                    <div className="relative">
                                        <input
                                            type="text"
                                            value={answers[question.id] || ""}
                                            onChange={(e) =>
                                                handleCustomAnswer(question.id, e.target.value)
                                            }
                                            placeholder="Type your answer..."
                                            className="w-full pl-3 pr-20 py-2 rounded-lg text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-400 dark:focus:ring-gray-500 focus:border-gray-400 dark:focus:border-gray-500 transition-all"
                                            autoFocus
                                        />
                                        {question.suggested_answers.length > 0 && (
                                            <button
                                                onClick={() => handleToggleCustom(question.id)}
                                                className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 px-1.5 py-0.5 rounded"
                                            >
                                                Back
                                            </button>
                                        )}
                                    </div>
                                )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Footer with Submit Button */}
            <div className="px-4 py-3 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between gap-4">
                <div className="flex items-center gap-1.5 text-xs">
                    {allAnswered ? (
                        <>
                            <FiCheck className="text-green-600 dark:text-green-400" />
                            <span className="text-green-700 dark:text-green-400 font-medium">
                                Ready to submit
                            </span>
                        </>
                    ) : (
                        <>
                            <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                            <span className="text-gray-500 dark:text-gray-400">
                                {Object.keys(answers).filter(k => answers[k]?.trim()).length} / {questions.length} answered
                            </span>
                        </>
                    )}
                </div>

                <button
                    onClick={handleSubmit}
                    disabled={!allAnswered || isLoading}
                    className={cn(
                        "px-4 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 flex items-center gap-2 shadow-sm",
                        allAnswered && !isLoading
                            ? "bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 hover:bg-black dark:hover:bg-white/90"
                            : "bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed"
                    )}
                >
                    {isLoading ? (
                        <>
                            <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                            Processing...
                        </>
                    ) : (
                        <>
                            <FiSearch className="text-xs" />
                            Start Research
                        </>
                    )}
                </button>
            </div>
        </div>
    );
};

export default DeepResearchClarification;

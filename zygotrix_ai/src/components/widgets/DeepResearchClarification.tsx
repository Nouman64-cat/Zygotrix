/**
 * DeepResearchClarification Widget
 *
 * An interactive widget that displays clarification questions and collects
 * user answers before starting the deep research process.
 */

import React, { useState, useCallback } from "react";
import { FiSearch, FiCheck, FiAlertCircle } from "react-icons/fi";
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
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-2xl border border-blue-200 dark:border-blue-700/50 overflow-hidden">
            {/* Header */}
            <div className="px-5 py-4 bg-gradient-to-r from-blue-500 to-indigo-500 dark:from-blue-600 dark:to-indigo-600">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                        <FiSearch className="text-white text-lg" />
                    </div>
                    <div>
                        <h3 className="text-white font-semibold text-lg">
                            Deep Research - Clarification
                        </h3>
                        <p className="text-blue-100 text-sm">
                            Answer the questions below to refine your research
                        </p>
                    </div>
                </div>
            </div>

            {/* Questions */}
            <div className="p-5 space-y-6">
                {questions.map((question, index) => (
                    <div key={question.id} className="space-y-3">
                        {/* Question */}
                        <div className="flex items-start gap-3">
                            <div
                                className={cn(
                                    "w-7 h-7 rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0",
                                    answers[question.id]
                                        ? "bg-emerald-500 text-white"
                                        : "bg-blue-100 dark:bg-blue-800 text-blue-600 dark:text-blue-300"
                                )}
                            >
                                {answers[question.id] ? (
                                    <FiCheck className="text-sm" />
                                ) : (
                                    index + 1
                                )}
                            </div>
                            <div className="flex-1">
                                <p className="text-gray-900 dark:text-gray-100 font-medium">
                                    {question.question}
                                </p>
                                {question.context && (
                                    <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                                        {question.context}
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Answer Options */}
                        <div className="ml-10 space-y-2">
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
                                                    "px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200",
                                                    answers[question.id] === suggestion
                                                        ? "bg-blue-500 text-white shadow-md"
                                                        : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30"
                                                )}
                                            >
                                                {suggestion}
                                            </button>
                                        ))}
                                        <button
                                            onClick={() => handleToggleCustom(question.id)}
                                            className="px-4 py-2 rounded-xl text-sm font-medium bg-transparent text-blue-500 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 border border-dashed border-blue-300 dark:border-blue-600 transition-all duration-200"
                                        >
                                            Custom answer...
                                        </button>
                                    </div>
                                )}

                            {/* Custom Input */}
                            {(customInputs[question.id] ||
                                question.suggested_answers.length === 0) && (
                                    <div className="space-y-2">
                                        <input
                                            type="text"
                                            value={answers[question.id] || ""}
                                            onChange={(e) =>
                                                handleCustomAnswer(question.id, e.target.value)
                                            }
                                            placeholder="Type your answer..."
                                            className="w-full px-4 py-3 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                        />
                                        {question.suggested_answers.length > 0 && (
                                            <button
                                                onClick={() => handleToggleCustom(question.id)}
                                                className="text-sm text-blue-500 dark:text-blue-400 hover:underline"
                                            >
                                                ← Back to suggestions
                                            </button>
                                        )}
                                    </div>
                                )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Footer with Submit Button */}
            <div className="px-5 py-4 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700/50">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm">
                        {allAnswered ? (
                            <>
                                <FiCheck className="text-emerald-500" />
                                <span className="text-emerald-600 dark:text-emerald-400">
                                    All questions answered
                                </span>
                            </>
                        ) : (
                            <>
                                <FiAlertCircle className="text-amber-500" />
                                <span className="text-gray-500 dark:text-gray-400">
                                    Answer all questions to continue
                                </span>
                            </>
                        )}
                    </div>

                    <button
                        onClick={handleSubmit}
                        disabled={!allAnswered || isLoading}
                        className={cn(
                            "px-6 py-2.5 rounded-xl font-semibold text-sm transition-all duration-300 flex items-center gap-2",
                            allAnswered && !isLoading
                                ? "bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white shadow-lg shadow-blue-500/30 cursor-pointer"
                                : "bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed"
                        )}
                    >
                        {isLoading ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Researching...
                            </>
                        ) : (
                            <>
                                <FiSearch className="text-sm" />
                                Start Deep Research
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DeepResearchClarification;

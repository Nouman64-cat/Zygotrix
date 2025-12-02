import React, { useEffect, useState } from "react";
import { Link, useParams, useLocation } from "react-router-dom";
import {
  FiTrendingUp,
  FiEye,
  FiMessageSquare,
  FiArrowUp,
} from "react-icons/fi";
import * as communityApi from "../../services/communityApi";
import type { Question } from "../../types/community";

interface CommunitySidebarProps {
  className?: string;
}

const CommunitySidebar: React.FC<CommunitySidebarProps> = ({ className }) => {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const [famousQuestions, setFamousQuestions] = useState<Question[]>([]);
  const [relatedQuestions, setRelatedQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const isQuestionDetailPage = location.pathname.includes("/questions/");

  useEffect(() => {
    const loadSidebarData = async () => {
      setIsLoading(true);
      try {
        // Load famous questions (high vote count + high view count)
        const famousResponse = await communityApi.listQuestions(
          1, // page
          8, // pageSize
          "most_voted" // sortBy
        );
        setFamousQuestions(famousResponse.questions);

        // If on question detail page, load related questions
        if (isQuestionDetailPage && id) {
          try {
            const currentQuestion = await communityApi.getQuestion(id);
            // Get questions with similar tags
            if (currentQuestion.tags.length > 0) {
              const relatedResponse = await communityApi.listQuestions(
                1, // page
                6, // pageSize
                "newest", // sortBy
                currentQuestion.tags[0] // tag
              );
              // Remove current question from related questions
              const filteredRelated = relatedResponse.questions.filter(
                (q: Question) => q.id !== id
              );
              setRelatedQuestions(filteredRelated.slice(0, 5));
            }
          } catch (err) {
            console.error("Failed to load related questions:", err);
          }
        }
      } catch (err) {
        console.error("Failed to load sidebar data:", err);
      } finally {
        setIsLoading(false);
      }
    };

    loadSidebarData();
  }, [id, isQuestionDetailPage]);

  const formatNumber = (num: number) => {
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + "k";
    }
    return num.toString();
  };

  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Famous Questions Section */}
      <div className="bg-slate-800/60 rounded-xl shadow-sm border border-slate-700 overflow-hidden">
        <div className="bg-gradient-to-r from-orange-900/30 to-red-900/30 px-4 py-3 border-b border-slate-700">
          <div className="flex items-center gap-2">
            <FiTrendingUp className="h-4 w-4 text-orange-600" />
            <h3 className="font-semibold text-white">Famous Questions</h3>
          </div>
          <p className="text-xs text-slate-400 mt-1">Most voted and viewed</p>
        </div>

        <div className="divide-y divide-slate-700">
          {isLoading
            ? // Loading skeleton
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="p-3 animate-pulse">
                  <div className="h-4 bg-slate-200 rounded w-full mb-2" />
                  <div className="h-3 bg-slate-200 rounded w-3/4 mb-2" />
                  <div className="flex gap-3">
                    <div className="h-3 bg-slate-200 rounded w-8" />
                    <div className="h-3 bg-slate-200 rounded w-8" />
                  </div>
                </div>
              ))
            : famousQuestions.map((question) => (
                <Link
                  key={question.id}
                  to={`/community/questions/${question.id}`}
                  className="block p-3 hover:bg-slate-700/50 transition-colors group"
                >
                  <h4 className="text-sm font-medium text-white group-hover:text-blue-400 transition-colors mb-1 leading-tight">
                    {truncateText(question.title, 80)}
                  </h4>
                  <div className="flex items-center gap-3 text-xs text-slate-400">
                    <div className="flex items-center gap-1">
                      <FiArrowUp className="h-3 w-3" />
                      <span>{formatNumber(question.upvotes)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <FiEye className="h-3 w-3" />
                      <span>{formatNumber(question.view_count)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <FiMessageSquare className="h-3 w-3" />
                      <span>{question.answer_count}</span>
                    </div>
                  </div>
                  {question.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {question.tags.slice(0, 2).map((tag) => (
                        <span
                          key={tag}
                          className="px-1.5 py-0.5 bg-blue-500/20 text-blue-300 rounded text-xs font-medium"
                        >
                          {tag}
                        </span>
                      ))}
                      {question.tags.length > 2 && (
                        <span className="text-xs text-slate-400">
                          +{question.tags.length - 2}
                        </span>
                      )}
                    </div>
                  )}
                </Link>
              ))}
        </div>

        <div className="p-3 bg-slate-900/30 border-t border-slate-700">
          <Link
            to="/community?sort=most_voted"
            className="text-xs text-blue-400 hover:text-blue-300 font-medium"
          >
            View all famous questions →
          </Link>
        </div>
      </div>

      {/* Related Questions Section (only on question detail pages) */}
      {isQuestionDetailPage && (
        <div className="bg-slate-800/60 rounded-xl shadow-sm border border-slate-700 overflow-hidden">
          <div className="bg-gradient-to-r from-green-900/30 to-emerald-900/30 px-4 py-3 border-b border-slate-700">
            <div className="flex items-center gap-2">
              <FiMessageSquare className="h-4 w-4 text-green-600" />
              <h3 className="font-semibold text-white">
                Related Questions
              </h3>
            </div>
            <p className="text-xs text-slate-400 mt-1">Similar topics</p>
          </div>

          <div className="divide-y divide-slate-700">
            {isLoading ? (
              // Loading skeleton
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="p-3 animate-pulse">
                  <div className="h-4 bg-slate-200 rounded w-full mb-2" />
                  <div className="h-3 bg-slate-200 rounded w-2/3 mb-2" />
                  <div className="flex gap-3">
                    <div className="h-3 bg-slate-200 rounded w-8" />
                    <div className="h-3 bg-slate-200 rounded w-8" />
                  </div>
                </div>
              ))
            ) : relatedQuestions.length > 0 ? (
              relatedQuestions.map((question) => (
                <Link
                  key={question.id}
                  to={`/community/questions/${question.id}`}
                  className="block p-3 hover:bg-slate-700/50 transition-colors group"
                >
                  <h4 className="text-sm font-medium text-white group-hover:text-green-400 transition-colors mb-1 leading-tight">
                    {truncateText(question.title, 70)}
                  </h4>
                  <div className="flex items-center gap-3 text-xs text-slate-400">
                    <div className="flex items-center gap-1">
                      <FiArrowUp className="h-3 w-3" />
                      <span>{formatNumber(question.upvotes)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <FiMessageSquare className="h-3 w-3" />
                      <span>{question.answer_count}</span>
                    </div>
                  </div>
                  {question.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {question.tags.slice(0, 2).map((tag) => (
                        <span
                          key={tag}
                          className="px-1.5 py-0.5 bg-green-500/20 text-green-300 rounded text-xs font-medium"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </Link>
              ))
            ) : (
              <div className="p-4 text-center text-sm text-slate-400">
                No related questions found
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CommunitySidebar;

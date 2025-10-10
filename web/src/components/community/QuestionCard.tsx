import React from "react";
import { Link } from "react-router-dom";
import { FiMessageSquare, FiEye, FiArrowUp } from "react-icons/fi";
import type { Question } from "../../types/community";

interface QuestionCardProps {
  question: Question;
}

const QuestionCard: React.FC<QuestionCardProps> = ({ question }) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 30) return `${diffDays}d ago`;
    const diffMonths = Math.floor(diffDays / 30);
    if (diffMonths < 12) return `${diffMonths}mo ago`;
    const diffYears = Math.floor(diffMonths / 12);
    return `${diffYears}y ago`;
  };

  return (
    <Link
      to={`/community/questions/${question.id}`}
      className="block bg-white rounded-xl p-4 shadow-sm hover:shadow-lg transition-all border border-slate-200 hover:border-blue-300 group relative overflow-hidden"
    >
      {/* Gradient accent on hover */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-50 to-purple-50 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

      <div className="relative flex gap-4">
        {/* Stats - Sleek vertical design */}
        <div className="flex flex-col gap-2 items-center justify-center min-w-[60px] py-2">
          <div
            className={`flex flex-col items-center px-2 py-1 rounded-lg transition-colors ${
              question.user_vote === 1
                ? "bg-blue-100 text-blue-700"
                : "bg-slate-50 text-slate-600"
            }`}
          >
            <FiArrowUp className="h-4 w-4 mb-0.5" />
            <span className="font-bold text-sm">{question.upvotes}</span>
            <span className="text-[9px] text-slate-500 uppercase tracking-wide">
              votes
            </span>
          </div>

          <div
            className={`flex flex-col items-center px-2 py-1 rounded-lg transition-colors ${
              question.answer_count > 0
                ? "bg-green-100 text-green-700"
                : "bg-slate-50 text-slate-600"
            }`}
          >
            <FiMessageSquare className="h-4 w-4 mb-0.5" />
            <span className="font-bold text-sm">{question.answer_count}</span>
            <span className="text-[9px] text-slate-500 uppercase tracking-wide">
              {question.answer_count === 1 ? "answer" : "answers"}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-bold text-slate-900 mb-2 group-hover:text-blue-600 transition-colors line-clamp-2 leading-tight">
            {question.title}
          </h3>
          <p className="text-sm text-slate-600 mb-3 line-clamp-2 leading-relaxed">
            {question.content}
          </p>

          {/* Tags */}
          {question.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-3">
              {question.tags.slice(0, 4).map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center px-2 py-0.5 bg-gradient-to-r from-slate-100 to-slate-50 border border-slate-200 text-slate-700 rounded-md text-xs font-medium"
                >
                  #{tag}
                </span>
              ))}
              {question.tags.length > 4 && (
                <span className="px-2 py-0.5 text-slate-500 text-xs font-medium">
                  +{question.tags.length - 4}
                </span>
              )}
            </div>
          )}

          {/* Meta - Enhanced */}
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5">
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-[10px]">
                  {(question.author.full_name ||
                    question.author.email)[0].toUpperCase()}
                </div>
                <span className="font-medium text-slate-700 truncate max-w-[120px]">
                  {question.author.full_name ||
                    question.author.email.split("@")[0]}
                </span>
              </div>
              <span className="text-slate-400">•</span>
              <FiEye className="h-3 w-3 text-slate-400" />
              <span className="text-slate-500">{question.view_count}</span>
            </div>
            <div className="flex-shrink-0 text-slate-500 font-medium">
              {formatDate(question.created_at)}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default QuestionCard;

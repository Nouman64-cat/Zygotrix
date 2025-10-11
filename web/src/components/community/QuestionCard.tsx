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
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-all overflow-hidden">
      {/* Post Header - Like LinkedIn/Quora */}
      <div className="p-4 pb-3">
        <div className="flex items-start gap-3">
          {/* Author Avatar */}
          <div className="flex-shrink-0">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm">
              {(question.author.full_name ||
                question.author.email)[0].toUpperCase()}
            </div>
          </div>

          {/* Author Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-900 truncate">
                {question.author.full_name ||
                  question.author.email.split("@")[0]}
              </span>
              <span className="text-slate-400">•</span>
              <span className="text-sm text-slate-500">
                {formatDate(question.created_at)}
              </span>
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <FiEye className="h-3 w-3 text-slate-400" />
              <span className="text-xs text-slate-500">
                {question.view_count} views
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Post Content */}
      <Link
        to={`/community/questions/${question.id}`}
        className="block hover:bg-slate-50/50 transition-colors"
      >
        <div className="px-4 pb-3">
          {/* Title */}
          <h3 className="text-lg font-bold text-slate-900 mb-2 hover:text-blue-600 transition-colors line-clamp-2">
            {question.title}
          </h3>

          {/* Content Preview */}
          <p className="text-sm text-slate-600 mb-3 line-clamp-3 leading-relaxed">
            {question.content}
          </p>

          {/* Image - Social Media Style */}
          {(question.image_thumbnail_url || question.image_url) && (
            <div className="mb-4 -mx-4 sm:mx-0 sm:rounded-xl overflow-hidden border-t border-b sm:border border-slate-200 bg-slate-50">
              <img
                src={question.image_thumbnail_url || question.image_url || ""}
                alt="Question illustration"
                loading="lazy"
                className="w-full h-auto max-h-[500px] object-contain bg-slate-50 cursor-pointer hover:scale-105 transition-transform duration-300"
                onError={(e) => {
                  e.currentTarget.parentElement?.remove();
                }}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  // Create modal overlay for full-size image viewing
                  const modal = document.createElement("div");
                  modal.className =
                    "fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4";
                  modal.onclick = () => modal.remove();

                  const img = e.currentTarget.cloneNode() as HTMLImageElement;
                  img.className =
                    "max-w-full max-h-full object-contain rounded-lg shadow-2xl";
                  img.onclick = (e) => e.stopPropagation();

                  modal.appendChild(img);
                  document.body.appendChild(modal);
                }}
              />
            </div>
          )}

          {/* Tags */}
          {question.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {question.tags.slice(0, 5).map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-full text-xs font-medium transition-colors"
                >
                  {tag}
                </span>
              ))}
              {question.tags.length > 5 && (
                <span className="px-2.5 py-1 text-slate-500 text-xs font-medium">
                  +{question.tags.length - 5} more
                </span>
              )}
            </div>
          )}
        </div>

        {/* Post Footer - Social Media Style Engagement */}
        <div className="px-4 py-3 border-t border-slate-100 bg-gradient-to-r from-slate-50/50 to-slate-50/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              {/* Upvotes */}
              <button
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full transition-all duration-200 ${
                  question.user_vote === 1
                    ? "bg-blue-100 text-blue-600 shadow-sm"
                    : "text-slate-600 hover:text-blue-600 hover:bg-blue-50"
                }`}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  // Handle upvote logic here
                }}
              >
                <FiArrowUp className="h-4 w-4" />
                <span className="text-sm font-semibold">
                  {question.upvotes}
                </span>
              </button>

              {/* Comments/Answers */}
              <button
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full transition-all duration-200 ${
                  question.answer_count > 0
                    ? "bg-green-100 text-green-600 shadow-sm"
                    : "text-slate-600 hover:text-green-600 hover:bg-green-50"
                }`}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  // Navigate to question detail page
                }}
              >
                <FiMessageSquare className="h-4 w-4" />
                <span className="text-sm font-semibold">
                  {question.answer_count}
                </span>
              </button>

              {/* Share Button */}
              <button
                className="flex items-center gap-2 px-3 py-1.5 rounded-full text-slate-600 hover:text-purple-600 hover:bg-purple-50 transition-all duration-200"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  // Handle share functionality
                  navigator
                    .share?.({
                      title: question.title,
                      text: question.content,
                      url:
                        window.location.origin +
                        `/community/questions/${question.id}`,
                    })
                    .catch(() => {
                      // Fallback: copy to clipboard
                      navigator.clipboard.writeText(
                        window.location.origin +
                          `/community/questions/${question.id}`
                      );
                    });
                }}
              >
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z"
                  />
                </svg>
              </button>
            </div>

            {/* View count - Social media style */}
            <div className="flex items-center gap-1 text-xs text-slate-500">
              <FiEye className="h-3 w-3" />
              <span>{question.view_count.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
};

export default QuestionCard;

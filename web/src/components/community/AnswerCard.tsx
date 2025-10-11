import React, { useState } from "react";
import {
  FiThumbsUp,
  FiThumbsDown,
  FiCheck,
  FiTrash2,
  FiEdit3,
  FiChevronDown,
  FiChevronUp,
} from "react-icons/fi";
import type { Answer } from "../../types/community";

interface AnswerCardProps {
  answer: Answer;
  currentUserId?: string;
  canAccept: boolean;
  onVote: (voteType: -1 | 0 | 1) => void;
  onAccept?: () => void;
  onDelete?: () => void;
  onEdit?: () => void;
}

const AnswerCard: React.FC<AnswerCardProps> = ({
  answer,
  currentUserId,
  canAccept,
  onVote,
  onAccept,
  onDelete,
  onEdit,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const isAuthor = currentUserId === answer.author.id;

  // Check if content is longer than 3 lines (approximately 240 characters)
  const isLongContent = answer.content.length > 240;
  const shouldShowCollapse = isLongContent && !isExpanded;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 transition-shadow hover:shadow-md">
      <div className="p-4 sm:p-5">
        {/* Accepted Answer Badge */}
        {answer.is_accepted && (
          <div className="flex items-center gap-2 mb-3 p-2 bg-green-50 border border-green-200 rounded-lg">
            <FiCheck className="h-4 w-4 text-green-600" />
            <span className="text-sm font-medium text-green-700">
              Accepted Answer
            </span>
          </div>
        )}

        {/* Author Info */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
            {(answer.author.full_name || answer.author.email)[0].toUpperCase()}
          </div>
          <div>
            <div className="font-medium text-slate-900 text-sm">
              {answer.author.full_name || answer.author.email}
            </div>
            <div className="text-xs text-slate-500">
              Answered {formatDate(answer.created_at)}
              {answer.updated_at && answer.updated_at !== answer.created_at && (
                <span className="ml-2">
                  (edited {formatDate(answer.updated_at)})
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="prose prose-sm max-w-none mb-4">
          <p className="text-xs md:text-sm text-slate-700 whitespace-pre-wrap">
            {shouldShowCollapse
              ? `${answer.content.substring(0, 240)}...`
              : answer.content}
          </p>

          {isLongContent && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="inline-flex items-center gap-1 mt-2 text-blue-600 hover:text-blue-700 text-sm font-medium transition-colors"
            >
              {isExpanded ? (
                <>
                  <span>Show less</span>
                  <FiChevronUp className="h-4 w-4" />
                </>
              ) : (
                <>
                  <span>Show more</span>
                  <FiChevronDown className="h-4 w-4" />
                </>
              )}
            </button>
          )}
        </div>

        {/* Bottom Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-100">
          {/* Voting and Accept */}
          <div className="flex items-center gap-3">
            {/* Upvote */}
            <button
              onClick={() => onVote(answer.user_vote === 1 ? 0 : 1)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all duration-200 ${
                answer.user_vote === 1
                  ? "bg-blue-100 text-blue-600 shadow-sm"
                  : "bg-slate-100 text-slate-600 hover:bg-blue-50 hover:text-blue-600"
              }`}
            >
              <FiThumbsUp className="h-4 w-4" />
              <span className="text-sm font-medium">{answer.upvotes}</span>
            </button>

            {/* Downvote */}
            <button
              onClick={() => onVote(answer.user_vote === -1 ? 0 : -1)}
              className={`flex items-center gap-1.5 p-1.5 rounded-lg transition-all duration-200 ${
                answer.user_vote === -1
                  ? "bg-red-100 text-red-600 shadow-sm"
                  : "bg-slate-100 text-slate-600 hover:bg-red-50 hover:text-red-600"
              }`}
            >
              <FiThumbsDown className="h-4 w-4" />
              <span className="text-sm font-medium">{answer.downvotes}</span>
            </button>

            {/* Accept Answer */}
            {canAccept && !answer.is_accepted && onAccept && (
              <button
                onClick={onAccept}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-600 hover:bg-green-100 rounded-lg transition-all duration-200"
                title="Accept this answer"
              >
                <FiCheck className="h-4 w-4" />
                <span className="text-sm font-medium">Accept</span>
              </button>
            )}
          </div>

          {/* Author Actions */}
          {isAuthor && (
            <div className="flex gap-1">
              {onEdit && (
                <button
                  onClick={onEdit}
                  className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                  title="Edit answer"
                >
                  <FiEdit3 className="h-4 w-4" />
                </button>
              )}
              {onDelete && (
                <button
                  onClick={onDelete}
                  className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition"
                  title="Delete answer"
                >
                  <FiTrash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AnswerCard;

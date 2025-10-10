import React from "react";
import {
  FiArrowUp,
  FiArrowDown,
  FiCheck,
  FiTrash2,
  FiEdit3,
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
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const isAuthor = currentUserId === answer.author.id;

  return (
    <div
      className={`bg-white rounded-lg shadow-sm border-2 overflow-hidden transition-all ${
        answer.is_accepted
          ? "border-green-400 shadow-green-100"
          : "border-slate-200"
      }`}
    >
      <div className="p-5">
        <div className="flex gap-4">
          {/* Voting - Compact */}
          <div className="flex flex-col items-center gap-1.5">
            <button
              onClick={() => onVote(answer.user_vote === 1 ? 0 : 1)}
              className={`p-1.5 rounded-lg transition ${
                answer.user_vote === 1
                  ? "bg-blue-600 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              <FiArrowUp className="h-4 w-4" />
            </button>
            <div className="text-lg font-bold text-slate-900">
              {answer.upvotes}
            </div>
            <button
              onClick={() => onVote(answer.user_vote === -1 ? 0 : -1)}
              className={`p-1.5 rounded-lg transition ${
                answer.user_vote === -1
                  ? "bg-red-600 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              <FiArrowDown className="h-4 w-4" />
            </button>

            {canAccept && !answer.is_accepted && onAccept && (
              <button
                onClick={onAccept}
                className="mt-1 p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition"
                title="Accept this answer"
              >
                <FiCheck className="h-4 w-4" />
              </button>
            )}

            {answer.is_accepted && (
              <div
                className="mt-1 p-1.5 bg-green-100 text-green-700 rounded-lg"
                title="Accepted answer"
              >
                <FiCheck className="h-4 w-4" />
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="prose prose-sm max-w-none mb-4">
              <p className="text-slate-700 whitespace-pre-wrap">
                {answer.content}
              </p>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              <div className="text-xs text-slate-500">
                <div className="mb-0.5">
                  Answered {formatDate(answer.created_at)}
                  {answer.updated_at &&
                    answer.updated_at !== answer.created_at && (
                      <span className="ml-2">
                        (edited {formatDate(answer.updated_at)})
                      </span>
                    )}
                </div>
                <div className="font-medium text-slate-700">
                  {answer.author.full_name || answer.author.email}
                </div>
              </div>

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
      </div>
    </div>
  );
};

export default AnswerCard;

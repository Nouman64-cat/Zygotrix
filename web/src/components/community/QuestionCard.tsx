import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  FiMessageSquare,
  FiEye,
  FiThumbsUp,
  FiThumbsDown,
  FiSend,
} from "react-icons/fi";
import type { Question, Comment } from "../../types/community";
import * as communityApi from "../../services/communityApi";
import { useAuth } from "../../context/AuthContext";

interface QuestionCardProps {
  question: Question;
  onVote?: (questionId: string, voteType: -1 | 0 | 1) => void;
}

const QuestionCard: React.FC<QuestionCardProps> = ({ question, onVote }) => {
  const { user } = useAuth();
  const [isExpanded, setIsExpanded] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentCount, setCommentCount] = useState(0);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");

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

  const handleCommentSubmit = async () => {
    if (!user || !commentText.trim() || isSubmittingComment) return;

    setIsSubmittingComment(true);
    try {
      const newComment = await communityApi.createComment(
        question.id,
        commentText.trim()
      );
      setComments((prev) => [...prev, newComment]);
      setCommentCount((prev) => prev + 1);
      setCommentText("");
    } catch (error) {
      console.error("Failed to create comment:", error);
      alert("Failed to create comment. Please try again.");
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleReplySubmit = async (parentCommentId: string) => {
    if (!user || !replyText.trim() || isSubmittingComment) return;

    setIsSubmittingComment(true);
    try {
      const newReply = await communityApi.createComment(
        question.id,
        replyText.trim(),
        parentCommentId
      );

      // Update the comments by adding the reply to the parent comment
      setComments((prev) =>
        prev.map((comment) => {
          if (comment.id === parentCommentId) {
            return {
              ...comment,
              replies: [...(comment.replies || []), newReply],
            };
          }
          return comment;
        })
      );

      setCommentCount((prev) => prev + 1);
      setReplyText("");
      setReplyingTo(null);
    } catch (error) {
      console.error("Failed to create reply:", error);
      alert("Failed to create reply. Please try again.");
    } finally {
      setIsSubmittingComment(false);
    }
  };

  // Function to count total comments including replies
  const countAllComments = (comments: Comment[]): number => {
    return comments.reduce((total, comment) => {
      return (
        total + 1 + (comment.replies ? countAllComments(comment.replies) : 0)
      );
    }, 0);
  };

  // Load comment count on component mount
  useEffect(() => {
    const loadCommentCount = async () => {
      try {
        const comments = await communityApi.getQuestionComments(question.id);
        setCommentCount(countAllComments(comments));
      } catch (error) {
        console.error("Failed to load comment count:", error);
      }
    };

    loadCommentCount();
  }, [question.id]);

  const handleToggleComments = async () => {
    if (!showComments) {
      // Load comments when opening the section
      setIsLoadingComments(true);
      try {
        const response = await communityApi.getQuestionComments(question.id);
        setComments(response);
      } catch (error) {
        console.error("Failed to load comments:", error);
      } finally {
        setIsLoadingComments(false);
      }
    }
    setShowComments(!showComments);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-all overflow-hidden">
      {/* Post Header - Like LinkedIn/Quora */}
      <div className="flex items-center p-3 sm:p-4 sm:pb-3">
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Author Avatar */}
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-xs sm:text-sm">
            {(question.author.full_name ||
              question.author.email)[0].toUpperCase()}
          </div>

          {/* Author Info */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <span className="font-semibold text-sm sm:text-base text-slate-900 truncate">
              {question.author.full_name || question.author.email.split("@")[0]}
            </span>
            <span className="text-slate-400 text-xs sm:text-sm">•</span>
            <span className="text-xs sm:text-sm text-slate-500">
              {formatDate(question.created_at)}
            </span>
          </div>
        </div>
      </div>

      {/* Post Content */}
      <Link
        to={`/community/questions/${question.id}`}
        className="block hover:bg-slate-50/50 transition-colors"
      >
        <div className="px-3 sm:px-4 pb-2 sm:pb-3">
          {/* Title */}
          <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-1.5 sm:mb-2 hover:text-blue-600 transition-colors line-clamp-2">
            {question.title}
          </h3>

          {/* Content Preview with Show More */}
          <div className="mb-2 sm:mb-3">
            <p
              className={`text-xs sm:text-sm text-slate-600 leading-relaxed ${
                !isExpanded && question.content.length > 280
                  ? "line-clamp-3"
                  : ""
              }`}
            >
              {question.content}
            </p>
            {question.content.length > 280 && (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsExpanded(!isExpanded);
                }}
                className="text-blue-600 hover:text-blue-700 text-xs sm:text-sm font-medium mt-1 transition-colors"
              >
                {isExpanded ? "Show less" : "Show more"}
              </button>
            )}
          </div>

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
            <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-2 sm:mb-3">
              {question.tags.slice(0, 5).map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center px-2 sm:px-2.5 py-0.5 sm:py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-full text-xs font-medium transition-colors"
                >
                  {tag}
                </span>
              ))}
              {question.tags.length > 5 && (
                <span className="px-2 sm:px-2.5 py-0.5 sm:py-1 text-slate-500 text-xs font-medium">
                  +{question.tags.length - 5} more
                </span>
              )}
            </div>
          )}
        </div>

        {/* Post Footer - Social Media Style Engagement */}
        <div className="px-3 sm:px-4 py-2 sm:py-3 border-t border-slate-100 bg-gradient-to-r from-slate-50/50 to-slate-50/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-4">
              {/* Upvotes */}
              <button
                className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full transition-all duration-200 ${
                  question.user_vote === 1
                    ? "bg-blue-100 text-blue-600 shadow-sm"
                    : "text-slate-600 hover:text-blue-600 hover:bg-blue-50"
                }`}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onVote?.(question.id, question.user_vote === 1 ? 0 : 1);
                }}
              >
                <FiThumbsUp className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span className="text-xs sm:text-sm font-semibold">
                  {question.upvotes}
                </span>
              </button>

              {/* Downvotes */}
              <button
                className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full transition-all duration-200 ${
                  question.user_vote === -1
                    ? "bg-red-100 text-red-600 shadow-sm"
                    : "text-slate-600 hover:text-red-600 hover:bg-red-50"
                }`}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onVote?.(question.id, question.user_vote === -1 ? 0 : -1);
                }}
              >
                <FiThumbsDown className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span className="text-xs sm:text-sm font-semibold">
                  {question.downvotes}
                </span>
              </button>

              {/* Comments */}
              <button
                className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full transition-all duration-200 ${
                  showComments || commentCount > 0
                    ? "bg-blue-100 text-blue-600 shadow-sm"
                    : "text-slate-600 hover:text-blue-600 hover:bg-blue-50"
                }`}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleToggleComments();
                }}
              >
                <FiMessageSquare className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span className="text-xs sm:text-sm font-semibold">
                  {commentCount}
                </span>
              </button>

              {/* Answers Badge */}
              {question.answer_count > 0 && (
                <Link
                  to={`/community/questions/${question.id}`}
                  onClick={(e) => e.stopPropagation()}
                  className="flex items-center gap-1 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full bg-green-100 text-green-600 hover:bg-green-200 transition-all duration-200"
                >
                  <svg
                    className="h-3.5 w-3.5 sm:h-4 sm:w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span className="text-xs sm:text-sm font-semibold">
                    {question.answer_count} ans
                  </span>
                </Link>
              )}

              {/* Share Button */}
              <button
                className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-slate-600 hover:text-purple-600 hover:bg-purple-50 transition-all duration-200"
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
                  className="h-3.5 w-3.5 sm:h-4 sm:w-4"
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

      {/* Collapsible Comments Section - Instagram/LinkedIn Style */}
      {showComments && (
        <div className="border-t border-slate-100 bg-slate-50/50">
          {/* Comments List */}
          <div className="px-3 sm:px-4 py-3 space-y-3 max-h-60 overflow-y-auto">
            {isLoadingComments ? (
              <div className="text-xs text-slate-500 text-center py-2">
                Loading comments...
              </div>
            ) : comments.length > 0 ? (
              <div className="space-y-3">
                {comments.map((comment) => (
                  <div key={comment.id} className="flex gap-3 group">
                    {/* User Avatar */}
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0 shadow-sm">
                      {(comment.author.full_name ||
                        comment.author.email)[0].toUpperCase()}
                    </div>

                    <div className="flex-1 min-w-0">
                      {/* Comment Bubble */}
                      <div className="bg-white rounded-2xl px-4 py-3 shadow-sm border border-slate-200 group-hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="text-sm font-semibold text-slate-800">
                            {comment.author.full_name ||
                              comment.author.email.split("@")[0]}
                          </div>
                          <div className="text-xs text-slate-400">
                            {formatDate(comment.created_at)}
                          </div>
                        </div>
                        <div className="text-sm text-slate-700 leading-relaxed">
                          {comment.content}
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-4 mt-2 px-2">
                        {/* Reply Button - Only show for question owner */}
                        {user && user.id === question.author.id && (
                          <button
                            onClick={() => {
                              setReplyingTo(
                                replyingTo === comment.id ? null : comment.id
                              );
                              setReplyText("");
                            }}
                            className="flex items-center gap-1 text-xs text-slate-500 hover:text-blue-600 transition-colors"
                          >
                            <svg
                              className="h-3.5 w-3.5"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"
                              />
                            </svg>
                            Reply
                          </button>
                        )}
                      </div>

                      {/* Reply Input */}
                      {replyingTo === comment.id &&
                        user &&
                        user.id === question.author.id && (
                          <div className="mt-3 ml-4">
                            <div className="flex items-start gap-3">
                              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                                {(user.full_name ||
                                  user.email)[0].toUpperCase()}
                              </div>
                              <div className="flex-1">
                                <div className="bg-white rounded-2xl border-2 border-slate-200 focus-within:border-blue-400 transition-colors">
                                  <input
                                    type="text"
                                    placeholder="Write a reply..."
                                    value={replyText}
                                    onChange={(e) =>
                                      setReplyText(e.target.value)
                                    }
                                    className="w-full px-3 py-2 text-sm border-none outline-none bg-transparent placeholder-slate-400 rounded-2xl"
                                    onKeyPress={(e) => {
                                      if (
                                        e.key === "Enter" &&
                                        replyText.trim() &&
                                        !isSubmittingComment
                                      ) {
                                        handleReplySubmit(comment.id);
                                      }
                                    }}
                                    disabled={isSubmittingComment}
                                  />
                                </div>
                                {replyText.trim() && (
                                  <div className="flex justify-end mt-2 gap-2">
                                    <button
                                      onClick={() => {
                                        setReplyingTo(null);
                                        setReplyText("");
                                      }}
                                      className="px-3 py-1 text-xs text-slate-600 hover:text-slate-800 transition-colors"
                                    >
                                      Cancel
                                    </button>
                                    <button
                                      onClick={() =>
                                        handleReplySubmit(comment.id)
                                      }
                                      disabled={
                                        !replyText.trim() || isSubmittingComment
                                      }
                                      className="flex items-center gap-1 px-3 py-1 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 text-white text-xs font-medium rounded-full transition-colors"
                                    >
                                      {isSubmittingComment ? (
                                        <>
                                          <div className="h-3 w-3 border border-white border-t-transparent rounded-full animate-spin"></div>
                                          Replying...
                                        </>
                                      ) : (
                                        "Reply"
                                      )}
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        )}

                      {/* Display Replies */}
                      {comment.replies && comment.replies.length > 0 && (
                        <div className="mt-3 ml-6 space-y-3">
                          {comment.replies.map((reply) => (
                            <div
                              key={reply.id}
                              className="flex gap-3 group/reply"
                            >
                              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-green-500 to-blue-500 flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                                {(reply.author.full_name ||
                                  reply.author.email)[0].toUpperCase()}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="bg-slate-50 rounded-2xl px-3 py-2 shadow-sm border border-slate-100 group-hover/reply:shadow-md transition-shadow">
                                  <div className="flex items-center gap-2 mb-1">
                                    <div className="text-xs font-semibold text-slate-800">
                                      {reply.author.full_name ||
                                        reply.author.email.split("@")[0]}
                                      {reply.author.id ===
                                        question.author.id && (
                                        <span className="ml-1 px-1.5 py-0.5 bg-blue-100 text-blue-600 text-xs font-medium rounded-full">
                                          Author
                                        </span>
                                      )}
                                    </div>
                                    <div className="text-xs text-slate-400">
                                      {formatDate(reply.created_at)}
                                    </div>
                                  </div>
                                  <div className="text-xs text-slate-700 leading-relaxed">
                                    {reply.content}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {question.answer_count > 0 && (
                  <div className="pt-2 border-t border-slate-200">
                    <div className="text-xs text-slate-500">
                      <Link
                        to={`/community/questions/${question.id}`}
                        className="text-blue-600 hover:text-blue-700 font-medium"
                      >
                        View {question.answer_count} answer
                        {question.answer_count !== 1 ? "s" : ""} →
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-xs text-slate-500 italic text-center py-2">
                No comments yet. Be the first to comment!
                {question.answer_count > 0 && (
                  <div className="mt-2">
                    <Link
                      to={`/community/questions/${question.id}`}
                      className="text-blue-600 hover:text-blue-700 font-medium"
                    >
                      View {question.answer_count} answer
                      {question.answer_count !== 1 ? "s" : ""} →
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Add Comment Input */}
          <div className="px-3 sm:px-4 pb-4 border-t border-slate-200">
            {user ? (
              <div className="mt-3">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0 shadow-sm">
                    {(user.full_name || user.email)[0].toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <div className="bg-white rounded-2xl border-2 border-slate-200 focus-within:border-blue-400 transition-colors">
                      <input
                        type="text"
                        placeholder="Write a comment..."
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        className="w-full px-4 py-3 text-sm border-none outline-none bg-transparent placeholder-slate-400 rounded-2xl"
                        onKeyPress={(e) => {
                          if (
                            e.key === "Enter" &&
                            commentText.trim() &&
                            !isSubmittingComment
                          ) {
                            handleCommentSubmit();
                          }
                        }}
                        disabled={isSubmittingComment}
                      />
                    </div>
                    {commentText.trim() && (
                      <div className="flex justify-end mt-2">
                        <button
                          onClick={handleCommentSubmit}
                          disabled={!commentText.trim() || isSubmittingComment}
                          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 text-white text-sm font-medium rounded-full transition-colors shadow-sm"
                        >
                          {isSubmittingComment ? (
                            <>
                              <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                              Posting...
                            </>
                          ) : (
                            <>
                              <FiSend className="h-4 w-4" />
                              Post
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="mt-3 text-center py-4 bg-gradient-to-r from-slate-50 to-blue-50 rounded-xl border border-slate-200">
                <div className="text-sm text-slate-600 mb-3">
                  💬 Join the conversation
                </div>
                <Link
                  to="/auth/login"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-full transition-colors shadow-sm"
                >
                  Sign in to comment
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
                      d="M17 8l4 4m0 0l-4 4m4-4H3"
                    />
                  </svg>
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default QuestionCard;

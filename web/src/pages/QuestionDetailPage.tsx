import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  FiMessageSquare,
  FiEye,
  FiTrash2,
  FiEdit3,
  FiBookmark,
  FiShare2,
  FiCopy,
  FiClock,
  FiUser,
  FiHeart,
  FiAward,
  FiArrowLeft,
} from "react-icons/fi";
import * as communityApi from "../services/communityApi";
import type { QuestionDetail, Answer } from "../types/community";
import { useAuth } from "../context/AuthContext";
import AnswerCard from "../components/community/AnswerCard";
import AuthPrompt from "../components/community/AuthPrompt";
import SubmitAnswerModal from "../components/community/SubmitAnswerModal";
import ConfirmationModal from "../components/community/ConfirmationModal";
import EditQuestionModal from "../components/community/EditQuestionModal";
import EditAnswerModal from "../components/community/EditAnswerModal";

const QuestionDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [question, setQuestion] = useState<QuestionDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAnswerModalOpen, setIsAnswerModalOpen] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [showCopiedFeedback, setShowCopiedFeedback] = useState(false);
  const [isEditQuestionModalOpen, setIsEditQuestionModalOpen] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    isOpen: boolean;
    type: "question" | "answer";
    id: string;
    title: string;
  }>({
    isOpen: false,
    type: "question",
    id: "",
    title: "",
  });
  const [isDeleting, setIsDeleting] = useState(false);
  const [editingAnswer, setEditingAnswer] = useState<Answer | null>(null);

  const loadQuestion = async () => {
    if (!id) return;

    setIsLoading(true);
    setError(null);

    try {
      const data = await communityApi.getQuestion(id);
      setQuestion(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load question");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadQuestion();
  }, [id]);

  const handleVoteAnswer = async (answerId: string, voteType: -1 | 0 | 1) => {
    if (!user) {
      alert("Please login to vote");
      return;
    }

    if (!question) return;

    // Optimistic update
    const updatedAnswers = question.answers.map((answer) => {
      if (answer.id === answerId) {
        const currentVote = answer.user_vote || 0;
        let newUpvotes = answer.upvotes;
        let newDownvotes = answer.downvotes;

        // Revert previous vote
        if (currentVote === 1) newUpvotes--;
        if (currentVote === -1) newDownvotes--;

        // Apply new vote
        if (voteType === 1) newUpvotes++;
        if (voteType === -1) newDownvotes++;

        return {
          ...answer,
          user_vote: voteType === 0 ? null : voteType,
          upvotes: newUpvotes,
          downvotes: newDownvotes,
        };
      }
      return answer;
    });

    // Update local state immediately
    setQuestion({
      ...question,
      answers: updatedAnswers,
    });

    try {
      await communityApi.voteAnswer(answerId, voteType);
    } catch (err) {
      // Revert on error
      await loadQuestion();
      alert(err instanceof Error ? err.message : "Failed to vote");
    }
  };

  const handleAcceptAnswer = async (answerId: string) => {
    if (!user || !id) return;

    try {
      await communityApi.acceptAnswer(id, answerId);
      await loadQuestion();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to accept answer");
    }
  };

  const handleDeleteQuestion = () => {
    if (!id || !user || !question) return;

    setDeleteConfirmation({
      isOpen: true,
      type: "question",
      id: id,
      title: question.title,
    });
  };

  const handleDeleteAnswer = (answerId: string) => {
    if (!user) return;

    const answer = question?.answers.find((a) => a.id === answerId);
    if (!answer) return;

    setDeleteConfirmation({
      isOpen: true,
      type: "answer",
      id: answerId,
      title: "this answer",
    });
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirmation.isOpen) return;

    setIsDeleting(true);

    try {
      if (deleteConfirmation.type === "question") {
        await communityApi.deleteQuestion(deleteConfirmation.id);
        navigate("/community");
      } else {
        await communityApi.deleteAnswer(deleteConfirmation.id);
        await loadQuestion();
      }

      setDeleteConfirmation({
        isOpen: false,
        type: "question",
        id: "",
        title: "",
      });
    } catch (err) {
      console.error("Delete failed:", err);
      // Keep the modal open to show the error
    } finally {
      setIsDeleting(false);
    }
  };

  const handleEditQuestion = () => {
    setIsEditQuestionModalOpen(true);
  };

  const handleQuestionUpdate = (updatedQuestion: QuestionDetail) => {
    setQuestion(updatedQuestion);
  };

  const handleEditAnswer = (answer: Answer) => {
    setEditingAnswer(answer);
  };

  const handleAnswerUpdate = (updatedAnswer: Answer) => {
    if (!question) return;

    const updatedAnswers = question.answers.map((answer) =>
      answer.id === updatedAnswer.id ? updatedAnswer : answer
    );

    setQuestion({
      ...question,
      answers: updatedAnswers,
    });

    setEditingAnswer(null);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const getTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return "Just now";
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400)
      return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800)
      return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return formatDate(dateString);
  };

  const handleBookmark = () => {
    setIsBookmarked(!isBookmarked);
    // Here you would typically save to backend
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setShowCopiedFeedback(true);
      setTimeout(() => setShowCopiedFeedback(false), 2000);
    } catch (err) {
      console.error("Failed to copy link:", err);
    }
  };

  const handleShare = async () => {
    if (navigator.share && question) {
      try {
        await navigator.share({
          title: question.title,
          text: question.content.substring(0, 100) + "...",
          url: window.location.href,
        });
      } catch (err) {
        // Fallback to copy link
        handleCopyLink();
      }
    } else {
      handleCopyLink();
    }
  };

  if (isLoading) {
    return (
      <div className="animate-fadeIn px-4 sm:px-6 lg:px-0">
        {/* Breadcrumb Skeleton */}
        <div className="flex items-center gap-2 mb-6">
          <div className="h-4 bg-slate-200 rounded w-12 animate-pulse"></div>
          <div className="h-4 w-4 bg-slate-200 rounded animate-pulse"></div>
          <div className="h-4 bg-slate-200 rounded w-16 animate-pulse"></div>
          <div className="h-4 w-4 bg-slate-200 rounded animate-pulse"></div>
          <div className="h-4 bg-slate-200 rounded w-20 animate-pulse"></div>
        </div>

        {/* Question Card Skeleton */}
        <div className="bg-slate-800/60 rounded-2xl shadow-lg border border-slate-700 overflow-hidden mb-8 relative">
          {/* Badge Skeleton */}
          <div className="absolute top-0 left-0 h-6 w-24 bg-gradient-to-r from-slate-200 to-slate-300 rounded-br-lg animate-pulse"></div>

          <div className="p-4 sm:p-6 pt-8 sm:pt-12">
            <div className="flex gap-3 sm:gap-6 flex-col sm:flex-row">
              {/* Voting Skeleton */}
              <div className="flex flex-row sm:flex-col items-center justify-center sm:justify-start gap-3 sm:gap-2 flex-shrink-0 order-2 sm:order-1">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-slate-200 rounded-xl animate-pulse"></div>
                <div className="w-6 h-6 sm:w-8 sm:h-8 bg-slate-200 rounded animate-pulse"></div>
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-slate-200 rounded-xl animate-pulse"></div>
              </div>

              {/* Content Skeleton */}
              <div className="flex-1 min-w-0 space-y-4 order-1 sm:order-2">
                {/* Title Skeleton */}
                <div className="space-y-2">
                  <div className="h-6 sm:h-8 bg-slate-200 rounded w-full animate-pulse"></div>
                  <div className="h-6 sm:h-8 bg-slate-200 rounded w-3/4 animate-pulse"></div>
                </div>

                {/* Stats Bar Skeleton */}
                <div className="flex items-center gap-3 sm:gap-6 p-3 bg-slate-800 rounded-xl flex-wrap">
                  <div className="h-4 bg-slate-700 rounded w-12 sm:w-16 animate-pulse"></div>
                  <div className="h-4 bg-slate-700 rounded w-16 sm:w-20 animate-pulse"></div>
                  <div className="h-4 bg-slate-700 rounded w-10 sm:w-12 animate-pulse"></div>
                </div>

                {/* Content Skeleton */}
                <div className="space-y-2">
                  <div className="h-4 bg-slate-700 rounded w-full animate-pulse"></div>
                  <div className="h-4 bg-slate-700 rounded w-full animate-pulse"></div>
                  <div className="h-4 bg-slate-700 rounded w-3/4 animate-pulse"></div>
                </div>

                {/* Tags Skeleton */}
                <div className="flex gap-2">
                  <div className="h-8 bg-slate-700 rounded-lg w-16 animate-pulse"></div>
                  <div className="h-8 bg-slate-700 rounded-lg w-20 animate-pulse"></div>
                  <div className="h-8 bg-slate-700 rounded-lg w-14 animate-pulse"></div>
                </div>

                {/* Author Section Skeleton */}
                <div className="flex items-center justify-between pt-6 border-t border-slate-700">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-slate-700 rounded-full animate-pulse"></div>
                    <div className="space-y-1">
                      <div className="h-4 bg-slate-700 rounded w-24 animate-pulse"></div>
                      <div className="h-3 bg-slate-700 rounded w-20 animate-pulse"></div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <div className="w-8 h-8 bg-slate-700 rounded-lg animate-pulse"></div>
                    <div className="w-8 h-8 bg-slate-700 rounded-lg animate-pulse"></div>
                    <div className="w-8 h-8 bg-slate-700 rounded-lg animate-pulse"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Answers Section Skeleton */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="h-8 bg-slate-700 rounded w-32 animate-pulse"></div>
            <div className="h-6 bg-slate-700 rounded w-24 animate-pulse"></div>
          </div>

          {/* Answer Cards Skeleton */}
          <div className="space-y-6">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6"
              >
                <div className="flex gap-4">
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-10 h-10 bg-slate-200 rounded-xl animate-pulse"></div>
                    <div className="w-6 h-6 bg-slate-200 rounded animate-pulse"></div>
                    <div className="w-10 h-10 bg-slate-200 rounded-xl animate-pulse"></div>
                  </div>
                  <div className="flex-1 space-y-3">
                    <div className="space-y-2">
                      <div className="h-4 bg-slate-200 rounded w-full animate-pulse"></div>
                      <div className="h-4 bg-slate-200 rounded w-full animate-pulse"></div>
                      <div className="h-4 bg-slate-200 rounded w-2/3 animate-pulse"></div>
                    </div>
                    <div className="flex items-center justify-between pt-3 border-t border-slate-200">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-slate-200 rounded-full animate-pulse"></div>
                        <div className="h-4 bg-slate-200 rounded w-16 animate-pulse"></div>
                      </div>
                      <div className="h-3 bg-slate-200 rounded w-12 animate-pulse"></div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Answer Button Skeleton */}
        <div className="h-16 bg-slate-200 rounded-2xl animate-pulse"></div>
      </div>
    );
  }

  if (error || !question) {
    return (
      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-0">
        <div className="bg-red-900/30 border border-red-400/50 rounded-lg p-4 sm:p-6 text-center">
          <p className="text-red-300 font-medium mb-4">
            {error || "Question not found"}
          </p>
          <Link
            to="/community"
            className="inline-block text-blue-400 hover:text-blue-300 font-medium"
          >
            Back to Community
          </Link>
        </div>
      </div>
    );
  }

  const isQuestionAuthor = user?.id === question.author.id;
  const canAcceptAnswer = isQuestionAuthor;

  return (
    <div className="px-4 sm:px-6 lg:px-0">
      {/* Mobile Back Button */}
      <div className="flex items-center mb-4 sm:hidden">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 px-3 py-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-all duration-200"
        >
          <FiArrowLeft className="h-5 w-5" />
          <span className="text-sm font-medium">Back</span>
        </button>
      </div>

      {/* Enhanced Question Card */}
      <div className="bg-slate-800/60 rounded-xl sm:rounded-2xl shadow-lg border border-slate-700 overflow-hidden mb-6 sm:mb-8 relative">
        <div className="p-3 sm:p-4 md:p-6 pt-6 sm:pt-8 md:pt-12">
          <div className="flex items-center gap-2 sm:gap-3 mb-2">
            <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
              <FiUser className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6" />
            </div>
            <div>
              <div className="text-xs sm:text-sm font-semibold text-white">
                {question.author.full_name ||
                  question.author.email.split("@")[0]}
              </div>
              <div className="text-[10px] sm:text-xs text-slate-400 flex items-center gap-1">
                <FiClock className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                <span className="hidden sm:inline">Asked</span>{" "}
                {getTimeAgo(question.created_at)}
              </div>
            </div>
          </div>
          <div className="flex gap-2 sm:gap-3 md:gap-6 flex-col sm:flex-row">
            {/* Enhanced Content Section */}
            {/* Author Info with Enhanced Design */}
            <div className="flex-1 min-w-0 order-1 sm:order-2">
              {/* Title with gradient */}
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold bg-gradient-to-r from-white via-slate-200 to-slate-300 bg-clip-text text-transparent mb-3 sm:mb-4 leading-tight">
                {question.title}
              </h1>

              {/* Enhanced Stats Bar */}
              <div className="flex items-center gap-2 sm:gap-3 md:gap-6 mb-4 sm:mb-6 p-2 sm:p-3 bg-gradient-to-r from-slate-800/50 to-slate-900/50 rounded-lg sm:rounded-xl flex-wrap">
                <div className="flex items-center gap-1 sm:gap-2 text-slate-300">
                  <FiEye className="h-3 w-3 sm:h-4 sm:w-4 text-blue-500" />
                  <span className="text-xs sm:text-sm font-medium">
                    {question.view_count.toLocaleString()}
                  </span>
                  <span className="text-[10px] sm:text-xs text-slate-400 hidden sm:inline">
                    views
                  </span>
                </div>
                <div className="flex items-center gap-1 sm:gap-2 text-slate-300">
                  <FiMessageSquare className="h-3 w-3 sm:h-4 sm:w-4 text-green-500" />
                  <span className="text-xs sm:text-sm font-medium">
                    {question.answer_count}
                  </span>
                  <span className="text-[10px] sm:text-xs text-slate-400 hidden sm:inline">
                    answers
                  </span>
                </div>
                <div className="flex items-center gap-1 sm:gap-2 text-slate-300">
                  <FiClock className="h-3 w-3 sm:h-4 sm:w-4 text-purple-500" />
                  <span className="text-xs sm:text-sm font-medium">
                    {getTimeAgo(question.created_at)}
                  </span>
                </div>
              </div>

              {/* Enhanced Content */}
              <div className="prose prose-slate max-w-none mb-4 sm:mb-6">
                <p className="text-sm sm:text-base md:text-lg text-slate-300 leading-relaxed whitespace-pre-wrap">
                  {question.content}
                </p>
              </div>

              {/* Question Image */}
              {question.image_url && (
                <div className="mb-4 sm:mb-6">
                  <img
                    src={question.image_url}
                    alt="Question illustration"
                    className="w-full max-w-full sm:max-w-2xl h-auto rounded-lg sm:rounded-xl border border-slate-700 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() =>
                      question.image_url &&
                      window.open(question.image_url, "_blank")
                    }
                  />
                </div>
              )}

              {/* Enhanced Tags */}
              {question.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-4 sm:mb-6">
                  {question.tags.map((tag, index) => (
                    <Link
                      key={tag}
                      to={`/community?tag=${tag}`}
                      className={`px-2 sm:px-2.5 md:px-3 py-1 sm:py-1.5 md:py-2 rounded-md sm:rounded-lg text-[11px] sm:text-xs md:text-sm font-medium transition-all duration-200 hover:scale-105 ${
                        index % 3 === 0
                          ? "bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 border border-blue-200 hover:from-blue-100 hover:to-indigo-100"
                          : index % 3 === 1
                          ? "bg-gradient-to-r from-green-50 to-emerald-50 text-green-700 border border-green-200 hover:from-green-100 hover:to-emerald-100"
                          : "bg-gradient-to-r from-purple-50 to-pink-50 text-purple-700 border border-purple-200 hover:from-purple-100 hover:to-pink-100"
                      }`}
                    >
                      #{tag}
                    </Link>
                  ))}
                </div>
              )}

              {/* Interactive Action Bar */}
              <div className="flex sm:flex-row items-start sm:items-center justify-end pt-4 sm:pt-6 border-t border-slate-700 gap-3 sm:gap-4">
                {/* Interactive Actions */} {/* Bookmark Button */}
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleBookmark}
                    className={`p-1.5 sm:p-2 rounded-lg transition-all duration-200 ${
                      isBookmarked
                        ? "bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30"
                        : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                    }`}
                    title="Bookmark this question"
                  >
                    <FiBookmark
                      className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${
                        isBookmarked ? "fill-current" : ""
                      }`}
                    />
                  </button>
                  {/* Share Button */}
                  <button
                    onClick={handleShare}
                    className="p-1.5 sm:p-2 rounded-lg bg-slate-700 text-slate-300 hover:bg-blue-900/20 hover:text-blue-400 transition-all duration-200"
                    title="Share this question"
                  >
                    <FiShare2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  </button>
                  {/* Copy Link Button with Feedback */}
                  <div className="relative">
                    <button
                      onClick={handleCopyLink}
                      className="p-1.5 sm:p-2 rounded-lg bg-slate-700 text-slate-300 hover:bg-green-900/20 hover:text-green-400 transition-all duration-200"
                      title="Copy link"
                    >
                      <FiCopy className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    </button>
                    {showCopiedFeedback && (
                      <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-green-600 text-white text-[10px] sm:text-xs px-2 py-1 rounded whitespace-nowrap">
                        Link copied!
                      </div>
                    )}
                  </div>
                  {/* Edit & Delete Buttons for Author */}
                  {isQuestionAuthor && (
                    <>
                      <button
                        onClick={handleEditQuestion}
                        className="p-1.5 sm:p-2 rounded-lg bg-blue-900/20 text-blue-400 hover:bg-blue-900/30 transition-all duration-200"
                        title="Edit question"
                      >
                        <FiEdit3 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      </button>
                      <button
                        onClick={handleDeleteQuestion}
                        className="p-1.5 sm:p-2 rounded-lg bg-red-900/20 text-red-400 hover:bg-red-900/30 transition-all duration-200"
                        title="Delete question"
                      >
                        <FiTrash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Answers Section */}
      <div className="mb-8">
        {/* Answers Header with Stats */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4 sm:gap-0">
          <div className="flex items-center gap-4 flex-wrap">
            <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-3">
              <div className="flex items-center gap-2">
                <FiMessageSquare className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
                <span>{question.answer_count}</span>
                <span className="text-base sm:text-lg">
                  {question.answer_count === 1 ? "Answer" : "Answers"}
                </span>
              </div>
            </h2>

            {/* Answer Quality Indicator */}
            {question.answers.some((a) => a.is_accepted) && (
              <div className="flex items-center gap-2 px-2 sm:px-3 py-1 bg-green-50 text-green-700 rounded-full text-xs sm:text-sm font-medium">
                <FiAward className="h-3 w-3 sm:h-4 sm:w-4" />
                <span>Solved</span>
              </div>
            )}
          </div>

          {/* Answer Stats */}
          <div className="flex items-center gap-4 text-xs sm:text-sm text-slate-300">
            <div className="flex items-center gap-1">
              <FiHeart className="h-3 w-3 sm:h-4 sm:w-4 text-red-500" />
              <span>
                {question.answers.reduce((sum, a) => sum + a.upvotes, 0)}
                <span className="hidden sm:inline"> total</span> votes
              </span>
            </div>
          </div>
        </div>

        {/* Answers Container */}
        {question.answers.length > 0 ? (
          <div className="space-y-6">
            {/* Accepted Answer First */}
            {question.answers
              .filter((answer) => answer.is_accepted)
              .map((answer) => (
                <div key={answer.id} className="relative">
                  {/* Accepted Answer Badge */}
                  <div className="absolute -top-3 left-6 z-10">
                    <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-4 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
                      <FiAward className="h-3 w-3" />
                      Accepted Answer
                    </div>
                  </div>
                  <div className="border-2 border-green-200 rounded-2xl overflow-hidden">
                    <AnswerCard
                      answer={answer}
                      currentUserId={user?.id}
                      canAccept={canAcceptAnswer}
                      onVote={(voteType) =>
                        handleVoteAnswer(answer.id, voteType)
                      }
                      onAccept={
                        canAcceptAnswer
                          ? () => handleAcceptAnswer(answer.id)
                          : undefined
                      }
                      onEdit={
                        user?.id === answer.author.id
                          ? () => handleEditAnswer(answer)
                          : undefined
                      }
                      onDelete={
                        user?.id === answer.author.id
                          ? () => handleDeleteAnswer(answer.id)
                          : undefined
                      }
                    />
                  </div>
                </div>
              ))}

            {/* Other Answers */}
            {question.answers
              .filter((answer) => !answer.is_accepted)
              .sort((a, b) => b.upvotes - a.upvotes) // Sort by votes
              .map((answer) => (
                <div key={answer.id} className="relative">
                  {/* High Quality Answer Badge */}
                  {answer.upvotes >= 5 && (
                    <div className="absolute -top-3 left-6 z-10">
                      <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                        <FiHeart className="h-3 w-3" />
                        High Quality
                      </div>
                    </div>
                  )}

                  <div
                    className={`rounded-2xl overflow-hidden transition-all duration-200 hover:shadow-md ${
                      answer.upvotes >= 5
                        ? "border-2 border-blue-400/50 bg-blue-900/10"
                        : "border border-slate-700 bg-slate-800/60"
                    }`}
                  >
                    <AnswerCard
                      answer={answer}
                      currentUserId={user?.id}
                      canAccept={canAcceptAnswer}
                      onVote={(voteType) =>
                        handleVoteAnswer(answer.id, voteType)
                      }
                      onAccept={
                        canAcceptAnswer
                          ? () => handleAcceptAnswer(answer.id)
                          : undefined
                      }
                      onEdit={
                        user?.id === answer.author.id
                          ? () => handleEditAnswer(answer)
                          : undefined
                      }
                      onDelete={
                        user?.id === answer.author.id
                          ? () => handleDeleteAnswer(answer.id)
                          : undefined
                      }
                    />
                  </div>
                </div>
              ))}
          </div>
        ) : (
          /* No Answers State */
          <div className="text-center py-8 sm:py-12 bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-2xl border-2 border-dashed border-slate-600">
            <FiMessageSquare className="h-10 w-10 sm:h-12 sm:w-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-base sm:text-lg font-semibold text-slate-300 mb-2">
              No answers yet
            </h3>
            <p className="text-sm sm:text-base text-slate-400 mb-4">
              Be the first to help solve this question!
            </p>
            {user && (
              <button
                onClick={() => setIsAnswerModalOpen(true)}
                className="inline-flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 text-sm sm:text-base"
              >
                <FiEdit3 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                Write the first answer
              </button>
            )}
          </div>
        )}
      </div>

      {/* Enhanced Answer Button/Prompt */}
      {user ? (
        <div className="sticky bottom-4 sm:bottom-6 z-20 px-4 sm:px-0">
          <button
            onClick={() => setIsAnswerModalOpen(true)}
            className="w-full bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 text-white font-bold py-4 sm:py-5 px-6 sm:px-8 rounded-2xl shadow-2xl hover:shadow-3xl hover:from-blue-700 hover:via-purple-700 hover:to-indigo-700 transition-all duration-300 flex items-center justify-center gap-3 sm:gap-4 group relative overflow-hidden"
          >
            {/* Background Animation */}
            <div className="absolute inset-0 bg-gradient-to-r from-blue-400 via-purple-400 to-indigo-400 opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>

            {/* Icon */}
            <div className="relative">
              <FiEdit3 className="h-5 w-5 sm:h-6 sm:w-6 group-hover:scale-125 group-hover:rotate-12 transition-all duration-300" />
              <div className="absolute -top-1 -right-1 w-2 h-2 bg-yellow-400 rounded-full opacity-0 group-hover:opacity-100 animate-ping transition-opacity duration-300"></div>
            </div>

            {/* Text */}
            <span className="text-base sm:text-lg relative">
              {question.answer_count === 0
                ? "Be the first to answer"
                : "Write an Answer"}
            </span>

            {/* Sparkle Effect */}
            <div className="absolute right-3 sm:right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              ✨
            </div>
          </button>
        </div>
      ) : (
        <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-2xl border-2 border-dashed border-slate-600 p-4 sm:p-8">
          <AuthPrompt
            message="Join the community to share your knowledge"
            action="answer this question"
          />
        </div>
      )}

      {/* Submit Answer Modal */}
      <SubmitAnswerModal
        isOpen={isAnswerModalOpen}
        onClose={() => setIsAnswerModalOpen(false)}
        questionId={id!}
        onSuccess={loadQuestion}
      />

      {/* Edit Question Modal */}
      {question && (
        <EditQuestionModal
          isOpen={isEditQuestionModalOpen}
          onClose={() => setIsEditQuestionModalOpen(false)}
          question={question}
          onUpdate={handleQuestionUpdate}
        />
      )}

      {/* Edit Answer Modal */}
      {editingAnswer && (
        <EditAnswerModal
          isOpen={!!editingAnswer}
          onClose={() => setEditingAnswer(null)}
          answer={editingAnswer}
          onUpdate={handleAnswerUpdate}
        />
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={deleteConfirmation.isOpen}
        onClose={() =>
          setDeleteConfirmation((prev) => ({ ...prev, isOpen: false }))
        }
        onConfirm={handleConfirmDelete}
        title={`Delete ${deleteConfirmation.type}`}
        message={`Are you sure you want to delete ${deleteConfirmation.title}? This action cannot be undone.`}
        confirmText="Delete"
        type="danger"
        isLoading={isDeleting}
      />
    </div>
  );
};

export default QuestionDetailPage;

import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  FiSearch,
  FiTag,
  FiPlus,
  FiUsers,
  FiMessageSquare,
  FiThumbsUp,
} from "react-icons/fi";
import * as communityApi from "../services/communityApi";
import type { Question, SortOption, PopularTag } from "../types/community";
import QuestionCard from "../components/community/QuestionCard";
import AuthPrompt from "../components/community/AuthPrompt";
import AskQuestionModal from "../components/community/AskQuestionModal";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import useDocumentTitle from "../hooks/useDocumentTitle";

const CommunityPage: React.FC = () => {
  useDocumentTitle("Community");

  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const { showToast } = useToast();

  const [questions, setQuestions] = useState<Question[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedTag, setSelectedTag] = useState<string | undefined>();
  const [popularTags, setPopularTags] = useState<PopularTag[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    communityApi.getPopularTags(20).then(setPopularTags).catch(console.error);
  }, []);

  useEffect(() => {
    const currentPage = parseInt(searchParams.get("page") || "1");
    const currentSort = (searchParams.get("sort") || "newest") as SortOption;
    const currentTag = searchParams.get("tag") || undefined;

    setPage(currentPage);
    setSelectedTag(currentTag);

    setIsLoading(true);
    setError(null);

    communityApi
      .listQuestions(currentPage, 20, currentSort, currentTag, undefined)
      .then((response) => {
        setQuestions(response.questions);
        setTotal(response.total);
        setTotalPages(response.total_pages);
      })
      .catch((err) => {
        setError(
          err instanceof Error ? err.message : "Failed to load questions"
        );
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [searchParams]);

  const handleTagClick = (tag: string) => {
    const params = new URLSearchParams(searchParams);
    if (selectedTag === tag) {
      params.delete("tag");
    } else {
      params.set("tag", tag);
    }
    params.set("page", "1");
    setSearchParams(params);
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      const params = new URLSearchParams(searchParams);
      params.set("page", newPage.toString());
      setSearchParams(params);
    }
  };

  const handleModalSuccess = () => {
    // Refresh questions after successful post
    const currentPage = parseInt(searchParams.get("page") || "1");
    const currentSort = (searchParams.get("sort") || "newest") as SortOption;
    const currentTag = searchParams.get("tag") || undefined;

    communityApi
      .listQuestions(currentPage, 20, currentSort, currentTag, undefined)
      .then((response) => {
        setQuestions(response.questions);
        setTotal(response.total);
        setTotalPages(response.total_pages);
      })
      .catch(console.error);
  };

  const handleVoteQuestion = async (
    questionId: string,
    voteType: -1 | 0 | 1
  ) => {
    if (!user) {
      showToast("Please sign in to vote on questions", "warning");
      return;
    }

    try {
      await communityApi.voteQuestion(questionId, voteType);

      // Update the question in the local state
      setQuestions((prevQuestions) =>
        prevQuestions.map((q) => {
          if (q.id === questionId) {
            const oldVote = q.user_vote || 0;
            let newUpvotes = q.upvotes;
            let newDownvotes = q.downvotes;

            // Remove the previous vote
            if (oldVote === 1) {
              newUpvotes -= 1;
            } else if (oldVote === -1) {
              newDownvotes -= 1;
            }

            // Add the new vote
            if (voteType === 1) {
              newUpvotes += 1;
            } else if (voteType === -1) {
              newDownvotes += 1;
            }

            return {
              ...q,
              user_vote: voteType,
              upvotes: newUpvotes,
              downvotes: newDownvotes,
            };
          }
          return q;
        })
      );
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to vote", "error");
    }
  };

  // Stats config for sidebar cards
  const statsConfig = [
    {
      label: "Questions",
      value: total.toLocaleString(),
      color: "blue",
      gradient: "from-blue-900/40 via-blue-800/40 to-indigo-900/40",
      border: "border-blue-500/30",
      hoverBorder: "hover:border-blue-400/50",
      iconBg: "bg-blue-500/20",
      iconHoverBg: "group-hover:bg-blue-500/30",
      textColor: "text-blue-100",
      labelColor: "text-blue-300",
      icon: <FiMessageSquare className="h-5 w-5 text-blue-400" />,
    },
    {
      label: "Answers",
      value: questions
        .reduce((sum, q) => sum + q.answer_count, 0)
        .toLocaleString(),
      color: "green",
      gradient: "from-green-900/40 via-green-800/40 to-emerald-900/40",
      border: "border-green-500/30",
      hoverBorder: "hover:border-green-400/50",
      iconBg: "bg-green-500/20",
      iconHoverBg: "group-hover:bg-green-500/30",
      textColor: "text-green-100",
      labelColor: "text-green-300",
      icon: <FiUsers className="h-5 w-5 text-green-400" />,
    },
    {
      label: "Active Tags",
      value: popularTags.length,
      color: "emerald",
      gradient: "from-emerald-900/40 via-emerald-800/40 to-teal-900/40",
      border: "border-emerald-500/30",
      hoverBorder: "hover:border-emerald-400/50",
      iconBg: "bg-emerald-500/20",
      iconHoverBg: "group-hover:bg-emerald-500/30",
      textColor: "text-emerald-100",
      labelColor: "text-emerald-300",
      icon: <FiTag className="h-5 w-5 text-emerald-400" />,
    },
    {
      label: "Total Votes",
      value: questions.reduce((sum, q) => sum + q.upvotes, 0).toLocaleString(),
      color: "amber",
      gradient: "from-amber-900/40 via-amber-800/40 to-orange-900/40",
      border: "border-amber-500/30",
      hoverBorder: "hover:border-amber-400/50",
      iconBg: "bg-amber-500/20",
      iconHoverBg: "group-hover:bg-amber-500/30",
      textColor: "text-amber-100",
      labelColor: "text-amber-300",
      icon: <FiThumbsUp className="h-5 w-5 text-amber-400" />,
    },
  ];

  return (
    <>
      <style>
        {`
          @keyframes fadeInUp {
            from {
              opacity: 0;
              transform: translateY(20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
        `}
      </style>
      <div className="animate-fadeIn h-screen flex flex-col">
        {/* Main Layout with Sidebar and Content */}
        <div className="flex flex-1 min-h-0">
          {/* Left Sidebar - Stats (Hidden on mobile) */}
          <div className="hidden lg:block w-80 px-6 border-r border-slate-700 bg-slate-800/50">
            <div className="space-y-6 overflow-y-auto scrollbar-thin scrollbar-thumb-blue-200 scrollbar-track-slate-100">
              {/* Stats Cards */}
              <div>
                <h1 className="text-2xl font-bold text-white">Community Stats</h1>
              </div>
              <div className="space-y-4">
                {statsConfig.map((stat) => (
                  <div
                    key={stat.label}
                    className={`group bg-gradient-to-br ${stat.gradient} rounded-2xl p-4 border-2 ${stat.border} ${stat.hoverBorder} transition-all duration-300 hover:scale-105 hover:shadow-lg cursor-pointer relative overflow-hidden`}
                  >
                    <div
                      className={`absolute top-0 right-0 w-12 h-12 ${stat.iconBg} rounded-bl-full opacity-50 group-hover:opacity-70 transition-opacity`}
                    ></div>
                    <div className="relative z-10 flex items-center justify-between">
                      <div>
                        <div
                          className={`text-2xl font-bold ${stat.textColor} mb-1 group-hover:scale-110 transition-transform`}
                        >
                          {stat.value}
                        </div>
                        <div
                          className={`text-sm font-semibold ${stat.labelColor}`}
                        >
                          {stat.label}
                        </div>
                      </div>
                      <div
                        className={`p-2 ${stat.iconBg} ${stat.iconHoverBg} rounded-xl transition-colors`}
                      >
                        {stat.icon}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Popular Tags */}
              {popularTags.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
                    <FiTag className="h-4 w-4" />
                    Popular Tags
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {popularTags.slice(0, 10).map((tag) => (
                      <button
                        key={tag.tag}
                        onClick={() => handleTagClick(tag.tag)}
                        className={`inline-flex items-center px-3 py-1 rounded-full border text-sm font-medium transition-all truncate max-w-xs cursor-pointer select-none focus:outline-none focus:ring-2 focus:ring-[#3B82F6] ${selectedTag === tag.tag
                            ? "bg-gradient-to-r from-[#1E3A8A] to-[#10B981] text-white border-transparent shadow-md"
                            : "bg-slate-700 text-slate-300 border-slate-600 hover:bg-[#1E3A8A]/30 hover:border-[#3B82F6]"
                          }`}
                        title={tag.tag}
                      >
                        <span className="truncate font-semibold">
                          {tag.tag.length > 18
                            ? tag.tag.slice(0, 16) + "…"
                            : tag.tag}
                        </span>
                        <span
                          className={`ml-2 text-xs font-normal ${selectedTag === tag.tag
                              ? "text-white/80"
                              : "text-blue-700/70"
                            }`}
                        >
                          {tag.count}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Main Content Area - Scrollable Questions */}
          <div className="flex-1 overflow-y-auto px-4 sm:px-6 mb-10">
            <div className="max-w-2xl mx-auto space-y-6 pb-8">
              {/* Mobile Stats Banner */}
              <div className="block lg:hidden mb-4 sm:mb-6">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
                  {/* Questions Stat - Mobile */}
                  <div className="bg-gradient-to-br from-blue-900/40 to-blue-800/40 rounded-lg sm:rounded-xl p-2 sm:p-3 border border-blue-500/30 text-center">
                    <div className="text-base sm:text-lg font-bold text-blue-100">
                      {total.toLocaleString()}
                    </div>
                    <div className="text-[10px] sm:text-xs text-blue-300">
                      Questions
                    </div>
                  </div>
                  {/* Answers Stat - Mobile */}
                  <div className="bg-gradient-to-br from-green-900/40 to-green-800/40 rounded-lg sm:rounded-xl p-2 sm:p-3 border border-green-500/30 text-center">
                    <div className="text-base sm:text-lg font-bold text-green-100">
                      {questions
                        .reduce((sum, q) => sum + q.answer_count, 0)
                        .toLocaleString()}
                    </div>
                    <div className="text-[10px] sm:text-xs text-green-300">
                      Answers
                    </div>
                  </div>
                  {/* Tags Stat - Mobile */}
                  <div className="bg-gradient-to-br from-emerald-900/40 to-emerald-800/40 rounded-lg sm:rounded-xl p-2 sm:p-3 border border-emerald-500/30 text-center">
                    <div className="text-base sm:text-lg font-bold text-emerald-100">
                      {popularTags.length}
                    </div>
                    <div className="text-[10px] sm:text-xs text-emerald-300">
                      Tags
                    </div>
                  </div>
                  {/* Votes Stat - Mobile */}
                  <div className="bg-gradient-to-br from-amber-900/40 to-amber-800/40 rounded-lg sm:rounded-xl p-2 sm:p-3 border border-amber-500/30 text-center">
                    <div className="text-base sm:text-lg font-bold text-amber-100">
                      {questions
                        .reduce((sum, q) => sum + q.upvotes, 0)
                        .toLocaleString()}
                    </div>
                    <div className="text-[10px] sm:text-xs text-amber-300">
                      Votes
                    </div>
                  </div>
                </div>

                {/* Mobile Popular Tags */}
                {popularTags.length > 0 && (
                  <div className="mt-3 sm:mt-4">
                    <h3 className="text-xs sm:text-sm font-semibold text-slate-300 mb-2">
                      Popular Tags
                    </h3>
                    <div className="flex flex-wrap gap-1.5 sm:gap-2">
                      {popularTags.slice(0, 5).map((tag) => (
                        <button
                          key={tag.tag}
                          onClick={() => handleTagClick(tag.tag)}
                          className={`px-2 py-0.5 sm:py-1 rounded-lg text-[11px] sm:text-xs font-medium transition-all ${selectedTag === tag.tag
                              ? "bg-gradient-to-r from-[#1E3A8A] to-[#10B981] text-white shadow-md"
                              : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                            }`}
                        >
                          {tag.tag} ({tag.count})
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              {/* Loading State */}
              {isLoading && (
                <div className="space-y-5">
                  {[1, 2, 3, 4].map((n) => (
                    <div
                      key={n}
                      className="bg-slate-800/60 rounded-2xl p-4 sm:p-6 shadow-lg border-2 border-slate-700 animate-pulse"
                    >
                      <div className="flex gap-3 sm:gap-4">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-slate-300 rounded-full flex-shrink-0"></div>
                        <div className="flex-1 min-w-0">
                          <div className="h-4 bg-slate-300 rounded w-3/4 mb-2"></div>
                          <div className="h-3 bg-slate-200 rounded w-1/2 mb-4"></div>
                          <div className="h-4 bg-slate-200 rounded w-full mb-2"></div>
                          <div className="h-4 bg-slate-200 rounded w-5/6"></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Error State */}
              {!isLoading && error && (
                <div className="bg-gradient-to-br from-red-900/30 to-red-800/30 border-2 border-red-400/50 rounded-xl p-4 sm:p-8 text-center shadow-sm">
                  <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-3xl">⚠️</span>
                  </div>
                  <p className="text-red-300 font-semibold text-lg mb-2">
                    Oops! Something went wrong
                  </p>
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
              )}

              {/* Empty State */}
              {!isLoading && !error && questions.length === 0 && (
                <div className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 rounded-xl p-6 sm:p-12 text-center shadow-sm border border-slate-700">
                  <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-4 shadow-md">
                    <FiSearch className="h-10 w-10 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">
                    No questions yet
                  </h3>
                  <p className="text-slate-300 text-sm mb-6 max-w-md mx-auto">
                    Be the first to start a conversation in the Zygotrix
                    community!
                  </p>
                  {!user && (
                    <div className="max-w-sm mx-auto">
                      <AuthPrompt
                        message="Sign in to ask questions and help others"
                        action="participate"
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Questions List */}
              {!isLoading && !error && questions.length > 0 && (
                <>
                  {questions.map((question, index) => (
                    <div
                      key={question.id}
                      className="transform transition-all duration-300 hover:scale-[1.01] origin-center"
                      style={{
                        animationDelay: `${index * 100}ms`,
                        animation: "fadeInUp 0.6s ease-out forwards",
                      }}
                    >
                      <QuestionCard
                        question={question}
                        onVote={handleVoteQuestion}
                      />
                    </div>
                  ))}

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="mt-8 flex items-center justify-center gap-1 sm:gap-2 flex-wrap">
                      <button
                        onClick={() => handlePageChange(page - 1)}
                        disabled={page <= 1}
                        className="px-3 sm:px-4 py-2 rounded-lg bg-slate-800 border border-slate-600 text-slate-300 text-xs sm:text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-700 hover:border-slate-500 transition shadow-sm"
                      >
                        <span className="hidden sm:inline">← Previous</span>
                        <span className="sm:hidden">←</span>
                      </button>

                      <div className="flex items-center gap-1 sm:gap-1.5">
                        {Array.from(
                          { length: Math.min(totalPages, 5) },
                          (_, i) => {
                            let pageNum;
                            if (totalPages <= 5) {
                              pageNum = i + 1;
                            } else if (page <= 3) {
                              pageNum = i + 1;
                            } else if (page >= totalPages - 2) {
                              pageNum = totalPages - 4 + i;
                            } else {
                              pageNum = page - 2 + i;
                            }

                            return (
                              <button
                                key={pageNum}
                                onClick={() => handlePageChange(pageNum)}
                                className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg text-xs sm:text-sm font-medium transition ${page === pageNum
                                    ? "bg-gradient-to-r from-[#1E3A8A] to-[#10B981] text-white shadow-md"
                                    : "bg-slate-800 border border-slate-600 text-slate-300 hover:bg-slate-700"
                                  }`}
                              >
                                {pageNum}
                              </button>
                            );
                          }
                        )}
                      </div>

                      <button
                        onClick={() => handlePageChange(page + 1)}
                        disabled={page >= totalPages}
                        className="px-3 sm:px-4 py-2 rounded-lg bg-slate-800 border border-slate-600 text-slate-300 text-xs sm:text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-700 hover:border-slate-500 transition shadow-sm"
                      >
                        <span className="hidden sm:inline">Next →</span>
                        <span className="sm:hidden">→</span>
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Ask Question Modal */}
        <AskQuestionModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            handleModalSuccess();
          }}
        />

        {/* Floating Action Button */}
        {user && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-r from-[#1E3A8A] to-[#10B981] text-white rounded-full shadow-lg hover:shadow-xl active:scale-95 transition-all duration-200 flex items-center justify-center z-50"
            style={{
              boxShadow: "0 8px 32px rgba(30, 58, 138, 0.4)",
            }}
          >
            <FiPlus className="h-6 w-6 sm:h-8 sm:w-8" />
          </button>
        )}
      </div>
    </>
  );
};

export default CommunityPage;

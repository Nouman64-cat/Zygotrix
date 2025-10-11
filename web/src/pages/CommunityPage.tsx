import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  FiSearch,
  FiTag,
  FiPlus,
  FiUsers,
  FiMessageSquare,
  FiArrowUp,
} from "react-icons/fi";
import * as communityApi from "../services/communityApi";
import type { Question, SortOption, PopularTag } from "../types/community";
import QuestionCard from "../components/community/QuestionCard";
import AuthPrompt from "../components/community/AuthPrompt";
import AskQuestionModal from "../components/community/AskQuestionModal";
import { useAuth } from "../context/AuthContext";

const CommunityPage: React.FC = () => {
  // Ref for main content scrollable area
  const mainContentRef = React.useRef<HTMLDivElement>(null);

  // Forward wheel/touch events to main content area
  React.useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      if (!mainContentRef.current) return;
      // Only forward if not already targeting main content
      if (!mainContentRef.current.contains(e.target as Node)) {
        e.preventDefault();
        mainContentRef.current.scrollTop += e.deltaY;
      }
    };
    window.addEventListener("wheel", handleWheel, { passive: false });
    // window.addEventListener("touchmove", handleTouch, { passive: false });
    return () => {
      window.removeEventListener("wheel", handleWheel);
      // window.removeEventListener("touchmove", handleTouch);
    };
  }, []);
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();

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
          {/* Left Sidebar - Stats */}
          <div className="w-80 px-6 border-r border-slate-200 bg-slate-50/50">
            <div className="space-y-6">
              {/* Stats Cards */}
              <div>
                <h1 className="text-2xl font-bold">Community Stats</h1>
              </div>
              <div className="space-y-4">
                {/* Questions Stat */}
                <div className="group bg-gradient-to-br from-blue-50 via-blue-100 to-indigo-100 rounded-2xl p-4 border-2 border-blue-200 hover:border-blue-300 transition-all duration-300 hover:scale-105 hover:shadow-lg cursor-pointer relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-12 h-12 bg-blue-200 rounded-bl-full opacity-50 group-hover:opacity-70 transition-opacity"></div>
                  <div className="relative z-10 flex items-center justify-between">
                    <div>
                      <div className="text-2xl font-bold text-blue-900 mb-1 group-hover:scale-110 transition-transform">
                        {total.toLocaleString()}
                      </div>
                      <div className="text-sm text-blue-700 font-semibold">
                        Questions
                      </div>
                    </div>
                    <div className="p-2 bg-blue-200 rounded-xl group-hover:bg-blue-300 transition-colors">
                      <FiMessageSquare className="h-5 w-5 text-blue-800" />
                    </div>
                  </div>
                </div>

                {/* Answers Stat */}
                <div className="group bg-gradient-to-br from-green-50 via-green-100 to-emerald-100 rounded-2xl p-4 border-2 border-green-200 hover:border-green-300 transition-all duration-300 hover:scale-105 hover:shadow-lg cursor-pointer relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-12 h-12 bg-green-200 rounded-bl-full opacity-50 group-hover:opacity-70 transition-opacity"></div>
                  <div className="relative z-10 flex items-center justify-between">
                    <div>
                      <div className="text-2xl font-bold text-green-900 mb-1 group-hover:scale-110 transition-transform">
                        {questions
                          .reduce((sum, q) => sum + q.answer_count, 0)
                          .toLocaleString()}
                      </div>
                      <div className="text-sm text-green-700 font-semibold">
                        Answers
                      </div>
                    </div>
                    <div className="p-2 bg-green-200 rounded-xl group-hover:bg-green-300 transition-colors">
                      <FiUsers className="h-5 w-5 text-green-800" />
                    </div>
                  </div>
                </div>

                {/* Active Tags Stat */}
                <div className="group bg-gradient-to-br from-purple-50 via-purple-100 to-violet-100 rounded-2xl p-4 border-2 border-purple-200 hover:border-purple-300 transition-all duration-300 hover:scale-105 hover:shadow-lg cursor-pointer relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-12 h-12 bg-purple-200 rounded-bl-full opacity-50 group-hover:opacity-70 transition-opacity"></div>
                  <div className="relative z-10 flex items-center justify-between">
                    <div>
                      <div className="text-2xl font-bold text-purple-900 mb-1 group-hover:scale-110 transition-transform">
                        {popularTags.length}
                      </div>
                      <div className="text-sm text-purple-700 font-semibold">
                        Active Tags
                      </div>
                    </div>
                    <div className="p-2 bg-purple-200 rounded-xl group-hover:bg-purple-300 transition-colors">
                      <FiTag className="h-5 w-5 text-purple-800" />
                    </div>
                  </div>
                </div>

                {/* Total Votes Stat */}
                <div className="group bg-gradient-to-br from-amber-50 via-amber-100 to-orange-100 rounded-2xl p-4 border-2 border-amber-200 hover:border-amber-300 transition-all duration-300 hover:scale-105 hover:shadow-lg cursor-pointer relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-12 h-12 bg-amber-200 rounded-bl-full opacity-50 group-hover:opacity-70 transition-opacity"></div>
                  <div className="relative z-10 flex items-center justify-between">
                    <div>
                      <div className="text-2xl font-bold text-amber-900 mb-1 group-hover:scale-110 transition-transform">
                        {questions
                          .reduce((sum, q) => sum + q.upvotes, 0)
                          .toLocaleString()}
                      </div>
                      <div className="text-sm text-amber-700 font-semibold">
                        Total Votes
                      </div>
                    </div>
                    <div className="p-2 bg-amber-200 rounded-xl group-hover:bg-amber-300 transition-colors">
                      <FiArrowUp className="h-5 w-5 text-amber-800" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Popular Tags */}
              {popularTags.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                    <FiTag className="h-4 w-4" />
                    Popular Tags
                  </h3>
                  <div className="space-y-2">
                    {popularTags.slice(0, 10).map((tag) => (
                      <button
                        key={tag.tag}
                        onClick={() => handleTagClick(tag.tag)}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                          selectedTag === tag.tag
                            ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md"
                            : "bg-slate-50 text-slate-700 hover:bg-slate-100"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span>{tag.tag}</span>
                          <span className="text-xs opacity-70">
                            ({tag.count})
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Main Content Area - Scrollable Questions */}
          <div
            ref={mainContentRef}
            className="flex-1 overflow-y-auto px-6 mb-10"
          >
            <div className="max-w-2xl mx-auto space-y-6 pb-8">
              {/* Loading State */}
              {isLoading && (
                <div className="space-y-5">
                  {[1, 2, 3, 4].map((n) => (
                    <div
                      key={n}
                      className="bg-white rounded-2xl p-6 shadow-lg border-2 border-slate-200 animate-pulse"
                    >
                      <div className="flex gap-4">
                        <div className="w-10 h-10 bg-slate-300 rounded-full"></div>
                        <div className="flex-1">
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
                <div className="bg-gradient-to-br from-red-50 to-red-100 border-2 border-red-200 rounded-xl p-8 text-center shadow-sm">
                  <div className="w-16 h-16 bg-red-200 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-3xl">⚠️</span>
                  </div>
                  <p className="text-red-700 font-semibold text-lg mb-2">
                    Oops! Something went wrong
                  </p>
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
              )}

              {/* Empty State */}
              {!isLoading && !error && questions.length === 0 && (
                <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-12 text-center shadow-sm border border-slate-200">
                  <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-4 shadow-md">
                    <FiSearch className="h-10 w-10 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2">
                    No questions yet
                  </h3>
                  <p className="text-slate-600 text-sm mb-6 max-w-md mx-auto">
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
                      <QuestionCard question={question} />
                    </div>
                  ))}

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="mt-8 flex items-center justify-center gap-2">
                      <button
                        onClick={() => handlePageChange(page - 1)}
                        disabled={page <= 1}
                        className="px-4 py-2 rounded-lg bg-white border border-slate-300 text-slate-700 text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 hover:border-slate-400 transition shadow-sm"
                      >
                        ← Previous
                      </button>

                      <div className="flex items-center gap-1.5">
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
                                className={`w-8 h-8 rounded-lg text-sm font-medium transition ${
                                  page === pageNum
                                    ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md"
                                    : "bg-white border border-slate-300 text-slate-700 hover:bg-slate-50"
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
                        className="px-4 py-2 rounded-lg bg-white border border-slate-300 text-slate-700 text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 hover:border-slate-400 transition shadow-sm"
                      >
                        Next →
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Footer - Always visible */}
        <footer className="w-full bg-slate-50 border-t border-slate-200 py-4 text-center text-slate-600 text-sm">
          &copy; {new Date().getFullYear()} Zygotrix Community. All rights
          reserved.
        </footer>

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
            className="fixed bottom-6 right-6 w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full shadow-lg hover:shadow-xl active:scale-95 transition-all duration-200 flex items-center justify-center z-50"
            style={{
              boxShadow: "0 8px 32px rgba(59, 130, 246, 0.4)",
            }}
          >
            <FiPlus className="h-8 w-8" />
          </button>
        )}
      </div>
    </>
  );
};

export default CommunityPage;

import React, { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import {
  FiSearch,
  FiTag,
  FiPlus,
  FiHome,
  FiChevronRight,
  FiUsers,
  FiMessageSquare,
  FiFilter,
  FiX,
  FiRefreshCw,
  FiArrowUp,
} from "react-icons/fi";
import * as communityApi from "../services/communityApi";
import type { Question, SortOption, PopularTag } from "../types/community";
import QuestionCard from "../components/community/QuestionCard";
import AuthPrompt from "../components/community/AuthPrompt";
import AskQuestionModal from "../components/community/AskQuestionModal";
import { useAuth } from "../context/AuthContext";

const CommunityPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();

  const [questions, setQuestions] = useState<Question[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTag, setSelectedTag] = useState<string | undefined>();
  const [popularTags, setPopularTags] = useState<PopularTag[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    communityApi.getPopularTags(20).then(setPopularTags).catch(console.error);
  }, []);

  useEffect(() => {
    const currentPage = parseInt(searchParams.get("page") || "1");
    const currentSort = (searchParams.get("sort") || "newest") as SortOption;
    const currentTag = searchParams.get("tag") || undefined;
    const currentSearch = searchParams.get("search") || "";

    setPage(currentPage);
    setSortBy(currentSort);
    setSelectedTag(currentTag);
    setSearchTerm(currentSearch);

    setIsLoading(true);
    setError(null);

    communityApi
      .listQuestions(
        currentPage,
        20,
        currentSort,
        currentTag,
        currentSearch || undefined
      )
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

  const handleSortChange = (newSort: SortOption) => {
    const params = new URLSearchParams(searchParams);
    params.set("sort", newSort);
    params.set("page", "1");
    setSearchParams(params);
  };

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

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams);
    if (searchTerm) {
      params.set("search", searchTerm);
    } else {
      params.delete("search");
    }
    params.set("page", "1");
    setSearchParams(params);
  };

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams);
    params.set("page", newPage.toString());
    setSearchParams(params);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleModalSuccess = () => {
    // Refresh questions after posting
    const currentPage = parseInt(searchParams.get("page") || "1");
    const currentSort = (searchParams.get("sort") || "newest") as SortOption;
    const currentTag = searchParams.get("tag") || undefined;
    const currentSearch = searchParams.get("search") || "";

    communityApi
      .listQuestions(
        currentPage,
        20,
        currentSort,
        currentTag,
        currentSearch || undefined
      )
      .then((response) => {
        setQuestions(response.questions);
        setTotal(response.total);
        setTotalPages(response.total_pages);
      })
      .catch(console.error);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);

    const currentPage = parseInt(searchParams.get("page") || "1");
    const currentSort = (searchParams.get("sort") || "newest") as SortOption;
    const currentTag = searchParams.get("tag") || undefined;
    const currentSearch = searchParams.get("search") || "";

    try {
      const response = await communityApi.listQuestions(
        currentPage,
        20,
        currentSort,
        currentTag,
        currentSearch || undefined
      );
      setQuestions(response.questions);
      setTotal(response.total);
      setTotalPages(response.total_pages);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to refresh questions"
      );
    }

    setTimeout(() => setIsRefreshing(false), 500); // Visual feedback
  };

  const getPageTitle = () => {
    if (selectedTag) return `Questions tagged "${selectedTag}"`;
    if (searchTerm) return `Search results for "${searchTerm}"`;
    return "Community Questions";
  };

  const getPageSubtitle = () => {
    if (selectedTag) return `Explore questions related to ${selectedTag}`;
    if (searchTerm) return `Found ${total} results`;
    return "Ask questions, share knowledge, and help others learn";
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
      <div className="animate-fadeIn">
        {/* Enhanced Header Section */}
        <div className="mb-8">
          {/* Breadcrumb Navigation */}
          <nav className="flex items-center gap-2 text-sm text-slate-600 mb-4">
            <Link
              to="/"
              className="flex items-center gap-1 hover:text-blue-600 transition"
            >
              <FiHome className="h-4 w-4" />
              <span>Home</span>
            </Link>
            <FiChevronRight className="h-4 w-4" />
            <span className="text-slate-900 font-medium">Community</span>
          </nav>

          {/* Page Title & Actions */}
          <div className="flex items-start justify-between gap-4 mb-6">
            <div className="flex-1">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 via-slate-800 to-slate-700 bg-clip-text text-transparent mb-2">
                {getPageTitle()}
              </h1>
              <p className="text-slate-600 text-lg">{getPageSubtitle()}</p>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3">
              {/* Refresh Button */}
              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="p-3 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 text-slate-600 hover:from-slate-200 hover:to-slate-300 transition-all duration-200 disabled:opacity-50"
                title="Refresh questions"
              >
                <FiRefreshCw
                  className={`h-5 w-5 ${isRefreshing ? "animate-spin" : ""}`}
                />
              </button>

              {/* Ask Question Button (Desktop) */}
              {user && (
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="hidden sm:flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 group"
                >
                  <FiPlus className="h-5 w-5 group-hover:rotate-90 transition-transform duration-200" />
                  <span>Ask Question</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Enhanced Stats Banner */}
        <div className="mb-8 grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Questions Stat */}
          <div className="group bg-gradient-to-br from-blue-50 via-blue-100 to-indigo-100 rounded-2xl p-5 border-2 border-blue-200 hover:border-blue-300 transition-all duration-300 hover:scale-105 hover:shadow-lg cursor-pointer relative overflow-hidden">
            <div className="absolute top-0 right-0 w-16 h-16 bg-blue-200 rounded-bl-full opacity-50 group-hover:opacity-70 transition-opacity"></div>
            <div className="relative z-10 flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold text-blue-900 mb-1 group-hover:scale-110 transition-transform">
                  {total.toLocaleString()}
                </div>
                <div className="text-sm text-blue-700 font-semibold">
                  Questions
                </div>
              </div>
              <div className="p-3 bg-blue-200 rounded-xl group-hover:bg-blue-300 transition-colors">
                <FiMessageSquare className="h-6 w-6 text-blue-800" />
              </div>
            </div>
          </div>

          {/* Answers Stat */}
          <div className="group bg-gradient-to-br from-green-50 via-green-100 to-emerald-100 rounded-2xl p-5 border-2 border-green-200 hover:border-green-300 transition-all duration-300 hover:scale-105 hover:shadow-lg cursor-pointer relative overflow-hidden">
            <div className="absolute top-0 right-0 w-16 h-16 bg-green-200 rounded-bl-full opacity-50 group-hover:opacity-70 transition-opacity"></div>
            <div className="relative z-10 flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold text-green-900 mb-1 group-hover:scale-110 transition-transform">
                  {questions
                    .reduce((sum, q) => sum + q.answer_count, 0)
                    .toLocaleString()}
                </div>
                <div className="text-sm text-green-700 font-semibold">
                  Answers
                </div>
              </div>
              <div className="p-3 bg-green-200 rounded-xl group-hover:bg-green-300 transition-colors">
                <FiUsers className="h-6 w-6 text-green-800" />
              </div>
            </div>
          </div>

          {/* Active Tags Stat */}
          <div className="group bg-gradient-to-br from-purple-50 via-purple-100 to-violet-100 rounded-2xl p-5 border-2 border-purple-200 hover:border-purple-300 transition-all duration-300 hover:scale-105 hover:shadow-lg cursor-pointer relative overflow-hidden">
            <div className="absolute top-0 right-0 w-16 h-16 bg-purple-200 rounded-bl-full opacity-50 group-hover:opacity-70 transition-opacity"></div>
            <div className="relative z-10 flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold text-purple-900 mb-1 group-hover:scale-110 transition-transform">
                  {popularTags.length}
                </div>
                <div className="text-sm text-purple-700 font-semibold">
                  Active Tags
                </div>
              </div>
              <div className="p-3 bg-purple-200 rounded-xl group-hover:bg-purple-300 transition-colors">
                <FiTag className="h-6 w-6 text-purple-800" />
              </div>
            </div>
          </div>

          {/* Total Votes Stat */}
          <div className="group bg-gradient-to-br from-amber-50 via-amber-100 to-orange-100 rounded-2xl p-5 border-2 border-amber-200 hover:border-amber-300 transition-all duration-300 hover:scale-105 hover:shadow-lg cursor-pointer relative overflow-hidden">
            <div className="absolute top-0 right-0 w-16 h-16 bg-amber-200 rounded-bl-full opacity-50 group-hover:opacity-70 transition-opacity"></div>
            <div className="relative z-10 flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold text-amber-900 mb-1 group-hover:scale-110 transition-transform">
                  {questions
                    .reduce((sum, q) => sum + q.upvotes, 0)
                    .toLocaleString()}
                </div>
                <div className="text-sm text-amber-700 font-semibold">
                  Total Votes
                </div>
              </div>
              <div className="p-3 bg-amber-200 rounded-xl group-hover:bg-amber-300 transition-colors">
                <FiArrowUp className="h-6 w-6 text-amber-800" />
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Search and Filters */}
        <div className="mb-6">
          <div className="bg-white rounded-2xl border-2 border-slate-200 shadow-lg hover:shadow-xl transition-shadow duration-300 p-6">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Enhanced Search */}
              <form onSubmit={handleSearch} className="flex-1">
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                    <FiSearch
                      className={`h-5 w-5 transition-colors duration-200 ${
                        isSearchFocused ? "text-blue-600" : "text-slate-400"
                      }`}
                    />
                  </div>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onFocus={() => setIsSearchFocused(true)}
                    onBlur={() => setIsSearchFocused(false)}
                    placeholder="Search questions, topics, or keywords..."
                    className="w-full pl-12 pr-4 py-4 rounded-xl border-2 border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 focus:outline-none transition-all duration-200 text-sm bg-gradient-to-r from-slate-50 to-slate-100 focus:from-blue-50 focus:to-indigo-50"
                  />
                  {searchTerm && (
                    <button
                      type="button"
                      onClick={() => {
                        setSearchTerm("");
                        const params = new URLSearchParams(searchParams);
                        params.delete("search");
                        setSearchParams(params);
                      }}
                      className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      <FiX className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </form>

              {/* Enhanced Sort Options */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
                  <FiFilter className="h-4 w-4" />
                  <span>Sort by:</span>
                </div>
                <select
                  value={sortBy}
                  onChange={(e) =>
                    handleSortChange(e.target.value as SortOption)
                  }
                  className="px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 focus:outline-none transition-all duration-200 bg-gradient-to-r from-slate-50 to-slate-100 text-sm font-semibold text-slate-700 hover:from-slate-100 hover:to-slate-200 cursor-pointer"
                >
                  <option value="newest">🕐 Newest First</option>
                  <option value="oldest">📅 Oldest First</option>
                  <option value="most_voted">⬆️ Most Voted</option>
                  <option value="most_viewed">👁️ Most Viewed</option>
                  <option value="most_answered">💬 Most Answered</option>
                </select>
              </div>
            </div>

            {/* Search Stats */}
            {!isLoading && questions.length > 0 && (
              <div className="mt-4 flex items-center justify-between text-sm text-slate-600 bg-slate-50 rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <span>
                    Showing {questions.length} of {total.toLocaleString()}{" "}
                    questions
                  </span>
                  {(searchTerm || selectedTag) && (
                    <span className="text-blue-600 font-medium">
                      • Filtered results
                    </span>
                  )}
                </div>
                <div className="text-xs text-slate-500">
                  Page {page} of {totalPages}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Popular Tags - Horizontal Scroll */}
        {popularTags.length > 0 && (
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <FiTag className="h-4 w-4 text-slate-500" />
              <span className="text-xs font-semibold text-slate-700 uppercase tracking-wide">
                Popular Tags
              </span>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-slate-100">
              {popularTags.map((tag) => (
                <button
                  key={tag.tag}
                  onClick={() => handleTagClick(tag.tag)}
                  className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    selectedTag === tag.tag
                      ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md"
                      : "bg-white border border-slate-200 text-slate-700 hover:border-blue-300 hover:shadow-sm"
                  }`}
                >
                  {tag.tag} <span className="opacity-70">({tag.count})</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Results Info with Active Filters */}
        {(selectedTag || searchTerm) && (
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-slate-600">
              Active filters:
            </span>
            {selectedTag && (
              <button
                onClick={() => handleTagClick(selectedTag)}
                className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-md text-xs font-medium hover:bg-blue-200 transition"
              >
                <FiTag className="h-3 w-3" />
                {selectedTag}
                <span className="ml-1">×</span>
              </button>
            )}
            {searchTerm && (
              <button
                onClick={() => {
                  setSearchTerm("");
                  const params = new URLSearchParams(searchParams);
                  params.delete("search");
                  setSearchParams(params);
                }}
                className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-700 rounded-md text-xs font-medium hover:bg-purple-200 transition"
              >
                <FiSearch className="h-3 w-3" />"{searchTerm}"
                <span className="ml-1">×</span>
              </button>
            )}
          </div>
        )}

        {/* Questions List */}
        {isLoading && (
          <div className="space-y-5">
            {[1, 2, 3, 4].map((n) => (
              <div
                key={n}
                className="bg-white rounded-2xl p-6 shadow-lg border-2 border-slate-200 animate-pulse group hover:shadow-xl transition-all duration-300"
              >
                <div className="flex gap-6">
                  {/* Enhanced Stats Column */}
                  <div className="flex flex-col gap-3 min-w-[80px]">
                    <div className="flex flex-col items-center p-3 rounded-xl bg-gradient-to-br from-slate-200 to-slate-300">
                      <div className="h-5 w-8 bg-slate-300 rounded mb-1" />
                      <div className="h-3 w-12 bg-slate-300 rounded" />
                    </div>
                    <div className="flex flex-col items-center p-3 rounded-xl bg-gradient-to-br from-slate-200 to-slate-300">
                      <div className="h-5 w-8 bg-slate-300 rounded mb-1" />
                      <div className="h-3 w-12 bg-slate-300 rounded" />
                    </div>
                    <div className="flex flex-col items-center p-3 rounded-xl bg-gradient-to-br from-slate-200 to-slate-300">
                      <div className="h-5 w-8 bg-slate-300 rounded mb-1" />
                      <div className="h-3 w-12 bg-slate-300 rounded" />
                    </div>
                  </div>

                  {/* Enhanced Content */}
                  <div className="flex-1">
                    <div className="h-6 bg-gradient-to-r from-slate-200 to-slate-300 rounded-lg w-3/4 mb-4" />
                    <div className="space-y-2 mb-4">
                      <div className="h-4 bg-slate-200 rounded-lg w-full" />
                      <div className="h-4 bg-slate-200 rounded-lg w-5/6" />
                      <div className="h-4 bg-slate-200 rounded-lg w-4/5" />
                    </div>

                    {/* Enhanced Tags */}
                    <div className="flex gap-2 mb-4 flex-wrap">
                      <div className="h-7 w-20 bg-gradient-to-r from-blue-200 to-blue-300 rounded-xl" />
                      <div className="h-7 w-24 bg-gradient-to-r from-green-200 to-green-300 rounded-xl" />
                      <div className="h-7 w-16 bg-gradient-to-r from-purple-200 to-purple-300 rounded-xl" />
                    </div>

                    {/* Enhanced Footer */}
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 bg-gradient-to-br from-slate-200 to-slate-300 rounded-full" />
                        <div className="h-4 w-32 bg-slate-200 rounded-lg" />
                      </div>
                      <div className="h-4 w-24 bg-slate-200 rounded-lg" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

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

        {!isLoading && !error && questions.length === 0 && (
          <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-12 text-center shadow-sm border border-slate-200">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-4 shadow-md">
              <FiSearch className="h-10 w-10 text-blue-600" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">
              {searchTerm || selectedTag
                ? "No matches found"
                : "No questions yet"}
            </h3>
            <p className="text-slate-600 text-sm mb-6 max-w-md mx-auto">
              {searchTerm || selectedTag
                ? "Try adjusting your search terms or filters to find what you're looking for."
                : "Be the first to start a conversation in the Zygotrix community!"}
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

        {!isLoading && !error && questions.length > 0 && (
          <div className="space-y-5">
            {questions.map((question, index) => (
              <div
                key={question.id}
                className="transform transition-all duration-200 hover:scale-[1.02] origin-center"
                style={{
                  animationDelay: `${index * 100}ms`,
                  animation: "fadeInUp 0.6s ease-out forwards",
                }}
              >
                <QuestionCard question={question} />
              </div>
            ))}
          </div>
        )}

        {/* Pagination - Modern Design */}
        {!isLoading && !error && totalPages > 1 && (
          <div className="mt-8 flex items-center justify-center gap-2">
            <button
              onClick={() => handlePageChange(page - 1)}
              disabled={page <= 1}
              className="px-4 py-2 rounded-lg bg-white border border-slate-300 text-slate-700 text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 hover:border-slate-400 transition shadow-sm"
            >
              ← Previous
            </button>

            <div className="flex items-center gap-1.5">
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
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
                    className={`min-w-[36px] h-9 rounded-lg text-sm font-semibold transition shadow-sm ${
                      page === pageNum
                        ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md"
                        : "bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 hover:border-slate-400"
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
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

        {/* Floating Ask Question Button */}
        {user && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="fixed bottom-6 right-6 z-40 flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-full shadow-2xl hover:shadow-3xl hover:scale-105 transition-all duration-200 group"
          >
            <FiPlus className="h-5 w-5 group-hover:rotate-90 transition-transform duration-200" />
            <span className="hidden sm:inline">Ask Question</span>
          </button>
        )}

        {/* Ask Question Modal */}
        <AskQuestionModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            handleModalSuccess();
          }}
        />
      </div>
    </>
  );
};

export default CommunityPage;

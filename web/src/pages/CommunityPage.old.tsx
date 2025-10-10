import React, { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  FiMessageSquare,
  FiEye,
  FiArrowUp,
  FiSearch,
  FiPlus,
  FiTag,
} from "react-icons/fi";
import * as communityApi from "../services/communityApi";
import type { Question, SortOption, PopularTag } from "../types/community";
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

  useEffect(() => {
    // Load popular tags
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
  };

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
    <div className="min-h-screen bg-gradient-to-b from-white via-slate-50 to-slate-100">
      {/* DNA Pattern Background */}
      <div className="pointer-events-none fixed inset-0 opacity-[0.02]">
        <svg className="h-full w-full" xmlns="http://www.w3.org/2000/svg">
          <pattern
            id="community-dna"
            x="0"
            y="0"
            width="100"
            height="100"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M25,10 Q50,30 75,10 M25,90 Q50,70 75,90 M25,10 L25,90 M75,10 L75,90"
              stroke="currentColor"
              strokeWidth="1"
              fill="none"
            />
            <circle cx="25" cy="30" r="2" fill="currentColor" />
            <circle cx="75" cy="30" r="2" fill="currentColor" />
          </pattern>
          <rect width="100%" height="100%" fill="url(#community-dna)" />
        </svg>
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 via-blue-900 to-purple-900 bg-clip-text text-transparent mb-2">
                Community Q&A
              </h1>
              <p className="text-slate-600">
                Ask questions, share knowledge, and learn from the Zygotrix
                community
              </p>
            </div>
            {user && (
              <Link
                to="/community/ask"
                className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-3 text-white font-medium transition hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl"
              >
                <FiPlus className="h-5 w-5" />
                Ask Question
              </Link>
            )}
          </div>

          {/* Search and filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <form onSubmit={handleSearch} className="flex-1">
              <div className="relative">
                <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search questions..."
                  className="w-full pl-12 pr-4 py-3 rounded-lg border-2 border-slate-200 focus:border-blue-500 focus:outline-none transition-colors"
                />
              </div>
            </form>

            <select
              value={sortBy}
              onChange={(e) => handleSortChange(e.target.value as SortOption)}
              className="px-4 py-3 rounded-lg border-2 border-slate-200 focus:border-blue-500 focus:outline-none transition-colors bg-white"
            >
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
              <option value="most_voted">Most Voted</option>
              <option value="most_viewed">Most Viewed</option>
              <option value="most_answered">Most Answered</option>
            </select>
          </div>

          {/* Popular Tags */}
          {popularTags.length > 0 && (
            <div className="mt-6">
              <div className="flex items-center gap-2 mb-3">
                <FiTag className="h-4 w-4 text-slate-500" />
                <span className="text-sm font-medium text-slate-600">
                  Popular Tags
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {popularTags.slice(0, 15).map((tag) => (
                  <button
                    key={tag.tag}
                    onClick={() => handleTagClick(tag.tag)}
                    className={`px-3 py-1 rounded-full text-sm font-medium transition-all ${
                      selectedTag === tag.tag
                        ? "bg-blue-600 text-white"
                        : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                    }`}
                  >
                    {tag.tag} ({tag.count})
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Results Info */}
        <div className="mb-6 flex items-center justify-between text-sm text-slate-600">
          <div>
            {total} {total === 1 ? "question" : "questions"}
            {selectedTag && ` tagged with "${selectedTag}"`}
            {searchTerm && ` matching "${searchTerm}"`}
          </div>
          {selectedTag && (
            <button
              onClick={() => handleTagClick(selectedTag)}
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Clear filter
            </button>
          )}
        </div>

        {/* Questions List */}
        {isLoading && (
          <div className="space-y-4">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className="bg-white rounded-lg p-6 shadow-sm animate-pulse"
              >
                <div className="h-6 bg-slate-200 rounded w-3/4 mb-4" />
                <div className="h-4 bg-slate-200 rounded w-full mb-2" />
                <div className="h-4 bg-slate-200 rounded w-2/3" />
              </div>
            ))}
          </div>
        )}

        {!isLoading && error && (
          <div className="bg-red-50 border-2 border-red-200 rounded-lg p-6 text-center">
            <p className="text-red-600 font-medium">{error}</p>
          </div>
        )}

        {!isLoading && !error && questions.length === 0 && (
          <div className="bg-white rounded-lg p-12 text-center shadow-sm">
            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FiMessageSquare className="h-10 w-10 text-slate-400" />
            </div>
            <h3 className="text-xl font-semibold text-slate-900 mb-2">
              No questions found
            </h3>
            <p className="text-slate-600 mb-6">
              {searchTerm || selectedTag
                ? "Try adjusting your search or filters"
                : "Be the first to ask a question!"}
            </p>
            {user && (
              <Link
                to="/community/ask"
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-3 text-white font-medium hover:bg-blue-700 transition"
              >
                <FiPlus className="h-5 w-5" />
                Ask Question
              </Link>
            )}
          </div>
        )}

        {!isLoading && !error && questions.length > 0 && (
          <div className="space-y-4">
            {questions.map((question) => (
              <Link
                key={question.id}
                to={`/community/questions/${question.id}`}
                className="block bg-white rounded-lg p-6 shadow-sm hover:shadow-md transition-all border-2 border-transparent hover:border-blue-200 group"
              >
                <div className="flex gap-6">
                  {/* Stats */}
                  <div className="flex flex-col gap-3 text-center min-w-[80px]">
                    <div
                      className={`text-sm ${
                        question.user_vote === 1
                          ? "text-blue-600"
                          : "text-slate-600"
                      }`}
                    >
                      <FiArrowUp className="h-4 w-4 mx-auto mb-1" />
                      <div className="font-semibold">{question.upvotes}</div>
                      <div className="text-xs text-slate-500">votes</div>
                    </div>
                    <div
                      className={`text-sm ${
                        question.answer_count > 0
                          ? "text-green-600"
                          : "text-slate-600"
                      }`}
                    >
                      <FiMessageSquare className="h-4 w-4 mx-auto mb-1" />
                      <div className="font-semibold">
                        {question.answer_count}
                      </div>
                      <div className="text-xs text-slate-500">answers</div>
                    </div>
                    <div className="text-sm text-slate-600">
                      <FiEye className="h-4 w-4 mx-auto mb-1" />
                      <div className="font-semibold">{question.view_count}</div>
                      <div className="text-xs text-slate-500">views</div>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-slate-900 mb-2 group-hover:text-blue-600 transition-colors">
                      {question.title}
                    </h3>
                    <p className="text-slate-600 mb-4 line-clamp-2">
                      {question.content}
                    </p>

                    {/* Tags */}
                    {question.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-3">
                        {question.tags.map((tag) => (
                          <span
                            key={tag}
                            className="px-2 py-1 bg-slate-100 text-slate-700 rounded text-xs font-medium"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Meta */}
                    <div className="flex items-center justify-between text-sm text-slate-500">
                      <div>
                        Asked by{" "}
                        <span className="font-medium text-slate-700">
                          {question.author.full_name || question.author.email}
                        </span>
                      </div>
                      <div>{formatDate(question.created_at)}</div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Pagination */}
        {!isLoading && !error && totalPages > 1 && (
          <div className="mt-8 flex items-center justify-center gap-2">
            <button
              onClick={() => handlePageChange(page - 1)}
              disabled={page <= 1}
              className="px-4 py-2 rounded-lg border-2 border-slate-200 text-slate-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 transition"
            >
              Previous
            </button>

            <div className="flex items-center gap-2">
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
                    className={`w-10 h-10 rounded-lg font-medium transition ${
                      page === pageNum
                        ? "bg-blue-600 text-white"
                        : "border-2 border-slate-200 text-slate-700 hover:bg-slate-50"
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
              className="px-4 py-2 rounded-lg border-2 border-slate-200 text-slate-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 transition"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CommunityPage;

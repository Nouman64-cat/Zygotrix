import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { FiTag, FiX } from "react-icons/fi";
import * as communityApi from "../services/communityApi";
import { useAuth } from "../context/AuthContext";
import CommunityLayout from "../layouts/CommunityLayout";
import AuthPrompt from "../components/community/AuthPrompt";

const AskQuestionPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      const tag = tagInput.trim().toLowerCase();

      if (!tag) return;

      if (tags.length >= 5) {
        setError("Maximum 5 tags allowed");
        return;
      }

      if (tags.includes(tag)) {
        setError("Tag already added");
        return;
      }

      setTags([...tags, tag]);
      setTagInput("");
      setError(null);
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      setError("You must be logged in to ask a question");
      return;
    }

    if (!title.trim() || !content.trim()) {
      setError("Title and content are required");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const question = await communityApi.createQuestion({
        title: title.trim(),
        content: content.trim(),
        tags,
      });
      navigate(`/community/questions/${question.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to post question");
      setIsSubmitting(false);
    }
  };

  if (!user) {
    return (
      <CommunityLayout>
        <div className="max-w-2xl mx-auto">
          <AuthPrompt
            title="Login Required"
            message="You must be logged in to ask a question"
          />
        </div>
      </CommunityLayout>
    );
  }

  return (
    <CommunityLayout>
      <div className="max-w-3xl mx-auto">
      {/* DNA Pattern Background */}
      <div className="pointer-events-none fixed inset-0 opacity-[0.02]">
        <svg className="h-full w-full" xmlns="http://www.w3.org/2000/svg">
          <pattern
            id="ask-dna"
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
          <rect width="100%" height="100%" fill="url(#ask-dna)" />
        </svg>
      </div>

      <div className="relative z-10 mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-12">
        {/* Back button */}
        <Link
          to="/community"
          className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-6 transition"
        >
          <FiArrowLeft className="h-4 w-4" />
          Back to Community
        </Link>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 via-blue-900 to-purple-900 bg-clip-text text-transparent mb-2">
            Ask a Question
          </h1>
          <p className="text-slate-600">
            Share your question with the Zygotrix community
          </p>
        </div>

        {/* Guidelines */}
        <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6 mb-8">
          <h3 className="font-semibold text-blue-900 mb-3">
            Tips for asking a good question:
          </h3>
          <ul className="space-y-2 text-sm text-blue-800">
            <li className="flex items-start gap-2">
              <span className="mt-1">•</span>
              <span>
                Write a clear, specific title that summarizes your question
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1">•</span>
              <span>
                Provide detailed context and what you've already tried
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1">•</span>
              <span>Add relevant tags to help others find your question</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1">•</span>
              <span>Be respectful and follow community guidelines</span>
            </li>
          </ul>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-lg shadow-lg border-2 border-slate-100 p-8"
        >
          {error && (
            <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4 mb-6">
              <p className="text-red-600 font-medium">{error}</p>
            </div>
          )}

          {/* Title */}
          <div className="mb-6">
            <label
              htmlFor="title"
              className="block text-sm font-semibold text-slate-900 mb-2"
            >
              Title
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., How do I interpret GWAS results for polygenic traits?"
              className="w-full px-4 py-3 rounded-lg border-2 border-slate-200 focus:border-blue-500 focus:outline-none transition-colors"
              required
              maxLength={200}
            />
            <p className="mt-2 text-sm text-slate-500">
              {title.length}/200 characters
            </p>
          </div>

          {/* Content */}
          <div className="mb-6">
            <label
              htmlFor="content"
              className="block text-sm font-semibold text-slate-900 mb-2"
            >
              Question Details
            </label>
            <textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Provide more details about your question. Include any relevant context, what you've tried, and what you're hoping to achieve..."
              rows={12}
              className="w-full px-4 py-3 rounded-lg border-2 border-slate-200 focus:border-blue-500 focus:outline-none transition-colors resize-none"
              required
            />
            <p className="mt-2 text-sm text-slate-500">
              Be as detailed as possible to help others understand and answer
              your question
            </p>
          </div>

          {/* Tags */}
          <div className="mb-8">
            <label
              htmlFor="tags"
              className="block text-sm font-semibold text-slate-900 mb-2"
            >
              Tags (up to 5)
            </label>

            {/* Tag display */}
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {tags.map((tag) => (
                  <div
                    key={tag}
                    className="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium"
                  >
                    <FiTag className="h-3 w-3" />
                    <span>{tag}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="hover:text-blue-900 transition"
                    >
                      <FiX className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Tag input */}
            <input
              id="tags"
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleAddTag}
              placeholder="Type a tag and press Enter or comma"
              className="w-full px-4 py-3 rounded-lg border-2 border-slate-200 focus:border-blue-500 focus:outline-none transition-colors"
              disabled={tags.length >= 5}
            />
            <p className="mt-2 text-sm text-slate-500">
              Press Enter or comma to add a tag. Examples: gwas, genetics,
              variant-analysis
            </p>
          </div>

          {/* Submit */}
          <div className="flex items-center justify-between pt-6 border-t-2 border-slate-100">
            <Link
              to="/community"
              className="px-6 py-3 text-slate-700 font-medium hover:text-slate-900 transition"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isSubmitting || !title.trim() || !content.trim()}
              className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium rounded-lg hover:from-blue-700 hover:to-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
            >
              {isSubmitting ? "Posting..." : "Post Question"}
            </button>
          </div>
        </form>

        {/* Additional help */}
        <div className="mt-8 text-center text-sm text-slate-500">
          <p>
            Need help formatting your question?{" "}
            <a
              href="#"
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              View formatting guide
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default AskQuestionPage;

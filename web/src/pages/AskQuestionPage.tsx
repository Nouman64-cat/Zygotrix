import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { FiTag, FiX } from "react-icons/fi";
import * as communityApi from "../services/communityApi";
import { useAuth } from "../context/AuthContext";
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
      <div className="max-w-2xl mx-auto py-8">
        <AuthPrompt
          message="You must be logged in to ask a question"
          action="ask a question"
        />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">
          Ask a Question
        </h1>
        <p className="text-slate-600">
          Share your question with the Zygotrix community
        </p>
      </div>

      {/* Guidelines */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <h3 className="font-semibold text-blue-900 mb-2 text-sm">
          Tips for asking a good question:
        </h3>
        <ul className="space-y-1 text-xs text-blue-800">
          <li className="flex items-start gap-2">
            <span className="mt-0.5">•</span>
            <span>
              Write a clear, specific title that summarizes your question
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-0.5">•</span>
            <span>Provide detailed context and what you've already tried</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-0.5">•</span>
            <span>Add relevant tags to help others find your question</span>
          </li>
        </ul>
      </div>

      {/* Form */}
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-lg border border-slate-200 p-6"
      >
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
            <p className="text-red-600 text-sm font-medium">{error}</p>
          </div>
        )}

        {/* Title */}
        <div className="mb-4">
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
            className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition-colors text-sm"
            required
            maxLength={200}
          />
          <p className="mt-1 text-xs text-slate-500">
            {title.length}/200 characters
          </p>
        </div>

        {/* Content */}
        <div className="mb-4">
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
            rows={10}
            className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition-colors resize-none text-sm"
            required
          />
          <p className="mt-1 text-xs text-slate-500">
            Be as detailed as possible to help others understand your question
          </p>
        </div>

        {/* Tags */}
        <div className="mb-6">
          <label
            htmlFor="tags"
            className="block text-sm font-semibold text-slate-900 mb-2"
          >
            Tags (up to 5)
          </label>

          {/* Tag display */}
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-2">
              {tags.map((tag) => (
                <div
                  key={tag}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium"
                >
                  <FiTag className="h-3 w-3" />
                  <span>{tag}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="hover:text-blue-900 transition"
                  >
                    <FiX className="h-3.5 w-3.5" />
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
            className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition-colors text-sm"
            disabled={tags.length >= 5}
          />
          <p className="mt-1 text-xs text-slate-500">
            Press Enter or comma to add a tag. Examples: gwas, genetics,
            variant-analysis
          </p>
        </div>

        {/* Submit */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-200">
          <Link
            to="/community"
            className="px-4 py-2 text-slate-600 text-sm font-medium hover:text-slate-900 transition"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isSubmitting || !title.trim() || !content.trim()}
            className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-sm font-medium rounded-lg hover:from-blue-700 hover:to-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
          >
            {isSubmitting ? "Posting..." : "Post Question"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AskQuestionPage;

import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiX, FiTag, FiAlertCircle } from "react-icons/fi";
import * as communityApi from "../../services/communityApi";
import ImageUpload from "../common/ImageUpload";
import { cloudinaryService } from "../../services/cloudinaryService";
import { useAuth } from "../../context/AuthContext";

interface AskQuestionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AskQuestionModal: React.FC<AskQuestionModalProps> = ({
  isOpen,
  onClose,
}) => {
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageThumbnailUrl, setImageThumbnailUrl] = useState<string | null>(
    null
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { user } = useAuth();
  useEffect(() => {
    if (!isOpen) {
      document.body.style.overflow = "";
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

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

  const handleImageUpload = async (file: File) => {
    if (!user) {
      throw new Error("You must be logged in to upload images");
    }

    const result = await cloudinaryService.uploadQuestionImage(
      file,
      `temp-${Date.now()}`,
      user.id
    );

    setImageUrl(result.url);
    setImageThumbnailUrl(result.thumbnailUrl);

    return { url: result.url };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      setError("Title is required");
      return;
    }

    if (title.trim().length < 10) {
      setError("Title must be at least 10 characters");
      return;
    }

    if (!content.trim()) {
      setError("Content is required");
      return;
    }

    if (content.trim().length < 20) {
      setError("Content must be at least 20 characters");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const questionData = {
        title: title.trim(),
        content: content.trim(),
        tags,
        image_url: imageUrl || null,
        image_thumbnail_url: imageThumbnailUrl || null,
      };

      const question = await communityApi.createQuestion(questionData);

      setTitle("");
      setContent("");
      setTags([]);
      setTagInput("");
      setImageUrl(null);
      setImageThumbnailUrl(null);

      onClose();
      navigate(`/community/questions/${question.id}`);
    } catch (err) {
      console.error("=== ERROR SUBMITTING QUESTION ===");
      console.error("Error:", err);
      setError(err instanceof Error ? err.message : "Failed to post question");
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (isSubmitting) return;

    setTitle("");
    setContent("");
    setTags([]);
    setTagInput("");
    setImageUrl(null);
    setImageThumbnailUrl(null);
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex min-h-full items-start sm:items-center justify-center overflow-y-auto p-2 sm:p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={handleClose}
      />

      {/* Modal */}
      <div
        className="relative z-10 w-full max-w-2xl transform rounded-2xl bg-slate-800 text-left align-middle shadow-xl transition-all border border-slate-700"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex max-h-[calc(100vh-theme(spacing.8))] flex-col overflow-hidden min-h-0">
          {/* Header */}
          <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-slate-700">
            <div>
              <h2 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Ask a Question
              </h2>
              <p className="text-[10px] sm:text-xs text-slate-400 mt-0.5">
                Share your question with the community
              </p>
            </div>
            <button
              onClick={handleClose}
              disabled={isSubmitting}
              className="p-1.5 sm:p-2 hover:bg-slate-700 rounded-lg transition disabled:opacity-50"
            >
              <FiX className="h-4 w-4 sm:h-5 sm:w-5 text-slate-400" />
            </button>
          </div>

          {/* Form */}
          <form
            onSubmit={handleSubmit}
            className="flex flex-1 flex-col overflow-hidden min-h-0"
          >
            <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 sm:py-6 space-y-3 sm:space-y-4">
              {/* Error Alert */}
              {error && (
                <div className="flex items-start gap-2 sm:gap-3 p-2 sm:p-3 bg-red-900/20 border border-red-500/30 rounded-lg">
                  <FiAlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <p className="text-xs sm:text-sm text-red-400 font-medium">
                    {error}
                  </p>
                </div>
              )}

              {/* Title */}
              <div>
                <label
                  htmlFor="title"
                  className="block text-xs sm:text-sm font-semibold text-white mb-1 sm:mb-1.5"
                >
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  id="title"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., How do I interpret GWAS results for polygenic traits?"
                  className="w-full px-2.5 sm:px-3 py-2 sm:py-2.5 rounded-lg border border-slate-600 bg-slate-900/50 text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition text-xs sm:text-sm placeholder-slate-500"
                  required
                  maxLength={200}
                  disabled={isSubmitting}
                />
                <div className="flex items-center justify-between mt-1">
                  <p className="text-[10px] sm:text-xs text-slate-400">
                    Be specific and clear (min. 10 characters)
                  </p>
                  <p
                    className={`text-[10px] sm:text-xs ${
                      title.length >= 10 ? "text-green-400" : "text-slate-400"
                    }`}
                  >
                    {title.length}/200
                  </p>
                </div>
              </div>

              {/* Content */}
              <div>
                <label
                  htmlFor="content"
                  className="block text-xs sm:text-sm font-semibold text-white mb-1 sm:mb-1.5"
                >
                  Details <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Provide more details about your question. Include any relevant context, what you've tried, and what you're hoping to achieve..."
                  rows={6}
                  className="w-full px-2.5 sm:px-3 py-2 sm:py-2.5 rounded-lg border border-slate-600 bg-slate-900/50 text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition resize-none text-xs sm:text-sm placeholder-slate-500"
                  required
                  disabled={isSubmitting}
                />
                <div className="flex items-center justify-between mt-1">
                  <p className="text-[10px] sm:text-xs text-slate-400">
                    Provide context and details (min. 20 characters)
                  </p>
                  <p
                    className={`text-[10px] sm:text-xs ${
                      content.length >= 20
                        ? "text-green-400"
                        : content.length > 0
                        ? "text-orange-400"
                        : "text-slate-400"
                    }`}
                  >
                    {content.length}{" "}
                    {content.length < 20 &&
                      content.length > 0 &&
                      `(need ${20 - content.length} more)`}
                  </p>
                </div>
              </div>

              {/* Tags */}
              <div>
                <label
                  htmlFor="tags"
                  className="block text-xs sm:text-sm font-semibold text-white mb-1 sm:mb-1.5"
                >
                  Tags (up to 5)
                </label>

                {/* Tag display */}
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-2">
                    {tags.map((tag) => (
                      <div
                        key={tag}
                        className="inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-0.5 sm:py-1 bg-blue-500/20 border border-blue-500/30 text-blue-300 rounded-lg text-[10px] sm:text-xs font-medium"
                      >
                        <FiTag className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                        <span>{tag}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(tag)}
                          className="hover:text-blue-100 transition"
                        >
                          <FiX className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
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
                  className="w-full px-2.5 sm:px-3 py-2 sm:py-2.5 rounded-lg border border-slate-600 bg-slate-900/50 text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition text-xs sm:text-sm placeholder-slate-500"
                  disabled={tags.length >= 5 || isSubmitting}
                />
                <p className="mt-1 text-[10px] sm:text-xs text-slate-400">
                  Press Enter or comma to add. Examples: gwas, genetics,
                  variant-analysis
                </p>
              </div>

              {/* Image Upload */}
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-white mb-1 sm:mb-1.5">
                  Add Image (Optional)
                </label>
                <ImageUpload
                  onUpload={handleImageUpload}
                  maxSize={5}
                  acceptedFormats={["image/jpeg", "image/png", "image/webp"]}
                  currentImageUrl={imageUrl || undefined}
                  disabled={isSubmitting}
                  placeholder="Upload an image to illustrate your question"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 sm:gap-3 px-4 sm:px-6 py-3 sm:py-4 border-t border-slate-700">
              <button
                type="button"
                onClick={handleClose}
                disabled={isSubmitting}
                className="px-3 sm:px-4 py-1.5 sm:py-2 text-slate-300 text-xs sm:text-sm font-medium hover:bg-slate-700 rounded-lg transition disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !title.trim() || !content.trim()}
                className="px-4 sm:px-6 py-1.5 sm:py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-xs sm:text-sm font-semibold rounded-lg hover:from-blue-700 hover:to-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <svg
                      className="animate-spin h-3 w-3 sm:h-4 sm:w-4"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="none"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Posting...
                  </span>
                ) : (
                  "Post Question"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AskQuestionModal;

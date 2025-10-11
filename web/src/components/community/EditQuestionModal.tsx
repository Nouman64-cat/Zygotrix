import React, { useState, useEffect } from "react";
import { FiX, FiEdit3, FiSave, FiTag } from "react-icons/fi";
import * as communityApi from "../../services/communityApi";
import ImageUpload from "../common/ImageUpload";
import { cloudinaryService } from "../../services/cloudinaryService";
import { useAuth } from "../../context/AuthContext";
import type {
  QuestionDetail,
  QuestionUpdateRequest,
} from "../../types/community";

interface EditQuestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  question: QuestionDetail;
  onUpdate: (updatedQuestion: QuestionDetail) => void;
}

const EditQuestionModal: React.FC<EditQuestionModalProps> = ({
  isOpen,
  onClose,
  question,
  onUpdate,
}) => {
  const [form, setForm] = useState({
    title: "",
    content: "",
    tags: [] as string[],
  });
  const [tagInput, setTagInput] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageThumbnailUrl, setImageThumbnailUrl] = useState<string | null>(
    null
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { user } = useAuth();

  useEffect(() => {
    if (isOpen && question) {
      setForm({
        title: question.title,
        content: question.content,
        tags: [...question.tags],
      });
      setImageUrl(question.image_url || null);
      setImageThumbnailUrl(question.image_thumbnail_url || null);
      setTagInput("");
      setError(null);
    }
  }, [isOpen, question]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddTag = () => {
    const tag = tagInput.trim().toLowerCase();
    if (tag && !form.tags.includes(tag) && form.tags.length < 5) {
      setForm((prev) => ({ ...prev, tags: [...prev.tags, tag] }));
      setTagInput("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setForm((prev) => ({
      ...prev,
      tags: prev.tags.filter((tag) => tag !== tagToRemove),
    }));
  };

  const handleTagInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      handleAddTag();
    }
  };

  const handleImageUpload = async (file: File) => {
    if (!user) {
      throw new Error("You must be logged in to upload images");
    }

    const result = await cloudinaryService.uploadQuestionImage(
      file,
      `question-${question.id}`,
      user.id
    );

    setImageUrl(result.url);
    setImageThumbnailUrl(result.thumbnailUrl);

    // Return the result for the ImageUpload component to use for preview
    return { url: result.url };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (form.title.trim().length < 10) {
      setError("Title must be at least 10 characters long");
      return;
    }

    if (form.content.trim().length < 20) {
      setError("Content must be at least 20 characters long");
      return;
    }

    setIsSubmitting(true);

    try {
      const updateData: QuestionUpdateRequest = {
        title: form.title.trim(),
        content: form.content.trim(),
        tags: form.tags,
        image_url: imageUrl,
        image_thumbnail_url: imageThumbnailUrl,
      };

      const updatedQuestion = await communityApi.updateQuestion(
        question.id,
        updateData
      );
      // Update the current question with the new data while preserving answers
      const updatedQuestionDetail: QuestionDetail = {
        ...question,
        ...updatedQuestion,
      };
      onUpdate(updatedQuestionDetail);
      onClose();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to update question"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && !isSubmitting) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 z-50"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-xl sm:rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-slate-200">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-100 rounded-xl flex items-center justify-center">
              <FiEdit3 className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                Edit Question
              </h2>
              <p className="text-[10px] sm:text-sm text-slate-600">
                Update your question details
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1.5 sm:p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50"
          >
            <FiX className="h-4 w-4 sm:h-5 sm:w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border-2 border-red-200 rounded-xl p-3 sm:p-4">
                <p className="text-xs sm:text-sm text-red-600">{error}</p>
              </div>
            )}

            {/* Title */}
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5 sm:mb-2">
                Question Title
              </label>
              <input
                type="text"
                name="title"
                value={form.title}
                onChange={handleInputChange}
                placeholder="What's your question? Be specific and clear..."
                className="w-full px-3 sm:px-4 py-2 sm:py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 focus:outline-none transition-all text-xs sm:text-sm"
                disabled={isSubmitting}
                required
              />
              <p className="mt-1 text-[10px] sm:text-xs text-slate-500">
                {form.title.length}/100 characters (minimum 10)
              </p>
            </div>

            {/* Content */}
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5 sm:mb-2">
                Question Details
              </label>
              <textarea
                name="content"
                value={form.content}
                onChange={handleInputChange}
                rows={8}
                placeholder="Provide detailed information about your question. Include context, what you've tried, and what you're expecting..."
                className="w-full px-3 sm:px-4 py-2 sm:py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 focus:outline-none transition-all text-xs sm:text-sm resize-none"
                disabled={isSubmitting}
                required
              />
              <p className="mt-1 text-[10px] sm:text-xs text-slate-500">
                {form.content.length} characters (minimum 20)
              </p>
            </div>

            {/* Tags */}
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5 sm:mb-2">
                Tags
              </label>
              <div className="space-y-2 sm:space-y-3">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <FiTag className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 h-3 w-3 sm:h-4 sm:w-4 text-slate-400" />
                    <input
                      type="text"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={handleTagInputKeyDown}
                      placeholder="Add a tag..."
                      className="w-full pl-8 sm:pl-10 pr-3 sm:pr-4 py-1.5 sm:py-2 border-2 border-slate-200 rounded-lg focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 focus:outline-none transition-all text-xs sm:text-sm"
                      disabled={isSubmitting || form.tags.length >= 5}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleAddTag}
                    disabled={
                      !tagInput.trim() || form.tags.length >= 5 || isSubmitting
                    }
                    className="px-3 sm:px-4 py-1.5 sm:py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-xs sm:text-sm font-medium"
                  >
                    Add
                  </button>
                </div>

                {/* Tag List */}
                {form.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 sm:gap-2">
                    {form.tags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1 px-2 sm:px-3 py-0.5 sm:py-1 bg-blue-100 text-blue-800 rounded-full text-[11px] sm:text-sm font-medium"
                      >
                        #{tag}
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(tag)}
                          disabled={isSubmitting}
                          className="text-blue-600 hover:text-blue-800 transition-colors disabled:opacity-50"
                        >
                          <FiX className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
                <p className="text-[10px] sm:text-xs text-slate-500">
                  {form.tags.length}/5 tags • Press Enter or comma to add tags
                </p>
              </div>
            </div>

            {/* Image Upload */}
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5 sm:mb-2">
                Question Image (Optional)
              </label>
              <ImageUpload
                onUpload={handleImageUpload}
                maxSize={5}
                acceptedFormats={["image/jpeg", "image/png", "image/webp"]}
                currentImageUrl={imageUrl || undefined}
                disabled={isSubmitting}
                placeholder="Upload an image to illustrate your question"
              />
              <p className="mt-1 text-[10px] sm:text-xs text-slate-500">
                Supports JPEG, PNG, and WebP. Max size: 5MB
              </p>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="flex gap-2 sm:gap-3 justify-end p-4 sm:p-6 border-t border-slate-200">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-slate-700 bg-white border-2 border-slate-200 rounded-xl hover:bg-slate-50 hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-white bg-blue-600 rounded-xl hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 sm:w-4 sm:h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Updating...</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <FiSave className="h-3 w-3 sm:h-4 sm:w-4" />
                <span>Update Question</span>
              </div>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditQuestionModal;

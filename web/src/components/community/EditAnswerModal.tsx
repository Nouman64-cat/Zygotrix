import React, { useState, useEffect } from "react";
import { FiX, FiEdit3, FiSave } from "react-icons/fi";
import * as communityApi from "../../services/communityApi";
import type { Answer, AnswerUpdateRequest } from "../../types/community";

interface EditAnswerModalProps {
  isOpen: boolean;
  onClose: () => void;
  answer: Answer;
  onUpdate: (updatedAnswer: Answer) => void;
}

const EditAnswerModal: React.FC<EditAnswerModalProps> = ({
  isOpen,
  onClose,
  answer,
  onUpdate,
}) => {
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && answer) {
      setContent(answer.content);
      setError(null);
    }
  }, [isOpen, answer]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (content.trim().length < 20) {
      setError("Answer must be at least 20 characters long");
      return;
    }

    setIsSubmitting(true);

    try {
      const updateData: AnswerUpdateRequest = {
        content: content.trim(),
      };

      await communityApi.updateAnswer(answer.id, updateData);
      // Update the answer locally with the new content
      const updatedAnswer: Answer = {
        ...answer,
        content: content.trim(),
        updated_at: new Date().toISOString(),
      };
      onUpdate(updatedAnswer);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update answer");
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
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
      onClick={handleBackdropClick}
    >
      <div className="bg-slate-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col border border-slate-700">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-900/20 rounded-xl flex items-center justify-center">
              <FiEdit3 className="h-5 w-5 text-green-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Edit Answer</h2>
              <p className="text-sm text-slate-400">
                Update your answer content
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="p-2 text-slate-400 hover:text-slate-300 hover:bg-slate-700 rounded-lg transition-colors disabled:opacity-50"
          >
            <FiX className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Error Message */}
            {error && (
              <div className="bg-red-900/20 border-2 border-red-500/30 rounded-xl p-4">
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}

            {/* Answer Content */}
            <div>
              <label className="block text-sm font-semibold text-white mb-2">
                Your Answer
              </label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={12}
                placeholder="Provide a comprehensive answer to help solve the question. Include examples, explanations, and relevant details..."
                className="w-full px-4 py-3 border-2 border-slate-600 bg-slate-900/50 text-white rounded-xl focus:border-green-500 focus:ring-4 focus:ring-green-500/10 focus:outline-none transition-all text-sm resize-none placeholder-slate-500"
                disabled={isSubmitting}
                required
              />
              <p className="mt-1 text-xs text-slate-400">
                {content.length} characters (minimum 20)
              </p>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="flex gap-3 justify-end p-6 border-t border-slate-700">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 text-sm font-medium text-slate-300 bg-slate-800 border-2 border-slate-600 rounded-xl hover:bg-slate-700 hover:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={isSubmitting || content.trim().length < 20}
            className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-xl hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Updating...</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <FiSave className="h-4 w-4" />
                <span>Update Answer</span>
              </div>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditAnswerModal;
